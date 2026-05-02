"""
AI Skill Library — Streamlit Dashboard
Requires the skill-lib server to be running: skill-lib serve --port 3456
"""

import json
import requests
import streamlit as st

# ── config ────────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="AI Skill Library",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

API = st.sidebar.text_input("Server URL", value="http://127.0.0.1:3456", key="api_url")

FORMATS = ["generic", "openai", "ollama", "anthropic"]

# ── helpers ───────────────────────────────────────────────────────────────────

@st.cache_data(ttl=5)
def fetch(path, params=None):
    try:
        r = requests.get(f"{API}{path}", params=params, timeout=4)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None


def server_ok():
    data = fetch("/")
    return data is not None


def all_skills():
    data = fetch("/skills")
    return data["skills"] if data else []


def skill_detail(name):
    return fetch(f"/skills/{name}")


def skill_as_format(name, fmt):
    return fetch(f"/skills/{name}", params={"format": fmt})


def export_all(fmt, category=None):
    params = {"format": fmt}
    if category and category != "All":
        params["category"] = category
    return fetch("/export", params=params)


# ── sidebar nav ───────────────────────────────────────────────────────────────

st.sidebar.title("🧠 Skill Library")

if not server_ok():
    st.sidebar.error("Server offline")
    st.error(
        f"Cannot reach skill-lib server at **{API}**.\n\n"
        "Start it with:\n```\nskill-lib serve --port 3456\n```"
    )
    st.stop()

root = fetch("/")
st.sidebar.success(f"{root['totalSkills']} skills · {len(root['categories'])} categories")

page = st.sidebar.radio(
    "Navigate",
    ["📚 Browse", "🔍 Search", "📤 Export", "📊 Stats"],
    label_visibility="collapsed",
)

# ── page: Browse ──────────────────────────────────────────────────────────────

if page == "📚 Browse":
    st.title("📚 Browse Skills")

    skills = all_skills()
    categories = sorted({s["category"] for s in skills})

    col1, col2 = st.columns([2, 3])
    with col1:
        selected_cat = st.selectbox("Category", ["All"] + categories)
    with col2:
        all_tags = sorted({t for s in skills for t in s.get("tags", [])})
        selected_tags = st.multiselect("Tags", all_tags)

    filtered = skills
    if selected_cat != "All":
        filtered = [s for s in filtered if s["category"] == selected_cat]
    if selected_tags:
        filtered = [s for s in filtered if any(t in s.get("tags", []) for t in selected_tags)]

    st.caption(f"{len(filtered)} skill(s)")

    if not filtered:
        st.info("No skills match the current filters.")
    else:
        for skill in filtered:
            with st.expander(
                f"**{skill['name']}** · `{skill['category']}`  "
                + ("  ".join(f"`{t}`" for t in skill.get("tags", [])))
            ):
                st.markdown(skill["description"])

                badge = "🟢 tool-call" if skill.get("executionMode") == "tool-call" else "🔵 prompt-only"
                schema_badge = "📄 has schema" if skill.get("hasSchema") else "⚠️ no schema"
                st.caption(f"{badge} &nbsp;&nbsp; {schema_badge}")

                tab_md, tab_schema = st.tabs(["SKILL.md", "Schema JSON"])

                detail = skill_detail(skill["name"])
                if detail:
                    with tab_md:
                        st.markdown(detail.get("body", "_No body_"))
                    with tab_schema:
                        schema = detail.get("schema")
                        if schema:
                            st.json(schema)
                        else:
                            st.info("No schema.json for this skill.")

# ── page: Search ──────────────────────────────────────────────────────────────

elif page == "🔍 Search":
    st.title("🔍 Search Skills")

    query = st.text_input("Search name, description, tags, or category", placeholder="e.g. security")

    if query:
        results = fetch("/skills", params={"q": query})
        skills = results["skills"] if results else []
        st.caption(f"{len(skills)} result(s) for **{query}**")

        for skill in skills:
            with st.expander(f"**{skill['name']}** · `{skill['category']}`"):
                st.markdown(skill["description"])
                tags = "  ".join(f"`{t}`" for t in skill.get("tags", []))
                st.caption(tags)

                detail = skill_detail(skill["name"])
                if detail:
                    tab_md, tab_schema = st.tabs(["SKILL.md", "Schema JSON"])
                    with tab_md:
                        st.markdown(detail.get("body", "_No body_"))
                    with tab_schema:
                        schema = detail.get("schema")
                        if schema:
                            st.json(schema)
                        else:
                            st.info("No schema.json for this skill.")
    else:
        st.info("Type a query above to search across all skills.")

# ── page: Export ──────────────────────────────────────────────────────────────

elif page == "📤 Export":
    st.title("📤 Export Tool Definitions")
    st.markdown(
        "Generate tool-call JSON ready to paste into your agent code. "
        "Formats: **OpenAI**, **Anthropic**, **Ollama** (same as OpenAI), **generic**."
    )

    skills = all_skills()
    categories = sorted({s["category"] for s in skills})
    skill_names = [s["name"] for s in skills]

    col1, col2, col3 = st.columns(3)
    with col1:
        fmt = st.selectbox("Format", FORMATS)
    with col2:
        scope = st.radio("Scope", ["All skills", "By category", "Pick skills"], horizontal=True)
    with col3:
        if scope == "By category":
            selected_cat = st.selectbox("Category", categories, key="export_cat")
        elif scope == "Pick skills":
            selected_skills = st.multiselect("Skills", skill_names, key="export_pick")

    if st.button("Generate", type="primary"):
        if scope == "All skills":
            result = export_all(fmt)
        elif scope == "By category":
            result = export_all(fmt, category=selected_cat)
        elif scope == "Pick skills":
            if not selected_skills:
                st.warning("Select at least one skill.")
                result = None
            else:
                result = fetch("/export", params={"format": fmt, "names": ",".join(selected_skills)})

        if result:
            out = json.dumps(result, indent=2)
            st.caption(f"{len(result)} tool definition(s)")
            st.code(out, language="json")
            st.download_button(
                label="⬇️ Download JSON",
                data=out,
                file_name=f"skills-{fmt}.json",
                mime="application/json",
            )

    st.divider()
    st.subheader("Single skill preview")
    col_a, col_b = st.columns(2)
    with col_a:
        preview_skill = st.selectbox("Skill", skill_names, key="preview_skill")
    with col_b:
        preview_fmt = st.selectbox("Format", FORMATS, key="preview_fmt")

    if preview_skill:
        preview = skill_as_format(preview_skill, preview_fmt)
        if preview:
            st.code(json.dumps(preview, indent=2), language="json")

# ── page: Stats ───────────────────────────────────────────────────────────────

elif page == "📊 Stats":
    st.title("📊 Library Stats")

    skills = all_skills()
    if not skills:
        st.info("No skills found.")
        st.stop()

    # category breakdown
    cat_counts = {}
    for s in skills:
        cat_counts[s["category"]] = cat_counts.get(s["category"], 0) + 1

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Skills", len(skills))
    col2.metric("Categories", len(cat_counts))
    col3.metric(
        "With Schema",
        sum(1 for s in skills if s.get("hasSchema")),
        help="Skills that have a schema.json for tool-call use"
    )

    st.subheader("By Category")
    st.bar_chart(cat_counts)

    st.subheader("Execution Mode")
    mode_counts = {}
    for s in skills:
        m = s.get("executionMode", "unknown")
        mode_counts[m] = mode_counts.get(m, 0) + 1
    for mode, count in mode_counts.items():
        st.progress(count / len(skills), text=f"{mode}: {count}")

    st.subheader("All Tags")
    tag_counts = {}
    for s in skills:
        for t in s.get("tags", []):
            tag_counts[t] = tag_counts.get(t, 0) + 1

    if tag_counts:
        # render as weighted badges
        max_count = max(tag_counts.values())
        badge_html = " ".join(
            f'<span style="background:#1f4e79;color:white;padding:3px 10px;border-radius:12px;'
            f'font-size:{12 + 6 * (v / max_count):.0f}px;margin:3px;display:inline-block">'
            f'{t} <b>{v}</b></span>'
            for t, v in sorted(tag_counts.items(), key=lambda x: -x[1])
        )
        st.markdown(badge_html, unsafe_allow_html=True)
    else:
        st.info("No tags yet.")
