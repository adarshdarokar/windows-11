import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Virtual file system.
 * Tree of nodes keyed by id.
 * Node shape: { id, name, type: 'folder'|'file', parentId, ext?, content?, appId?, createdAt, updatedAt }
 * Root node has id 'root', parentId null, name 'This PC'.
 */

const now = () => Date.now();
let counter = 1;
const uid = (p = "n") => `${p}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function buildSeed() {
  const nodes = {};
  const add = (n) => {
    nodes[n.id] = { createdAt: now(), updatedAt: now(), ...n };
    return n.id;
  };

  add({ id: "root", name: "This PC", type: "folder", parentId: null });
  const desktop = add({ id: "desktop", name: "Desktop", type: "folder", parentId: "root" });

  // System folders
  add({ id: "documents", name: "Documents", type: "folder", parentId: "root" });
  add({ id: "pictures", name: "Pictures", type: "folder", parentId: "root" });
  add({ id: "downloads", name: "Downloads", type: "folder", parentId: "root" });
  add({ id: "recycle-bin", name: "Recycle Bin", type: "folder", parentId: "root" });

  // Top-level "portfolio" folders on the desktop
  const projects = add({ id: uid("f"), name: "Projects", type: "folder", parentId: desktop });
  const skills = add({ id: uid("f"), name: "Skills", type: "folder", parentId: desktop });
  const experience = add({ id: uid("f"), name: "Experience", type: "folder", parentId: desktop });
  const about = add({ id: uid("f"), name: "About", type: "folder", parentId: desktop });
  const contact = add({ id: uid("f"), name: "Contact", type: "folder", parentId: desktop });
  const resume = add({ id: "resume", name: "Resume", type: "folder", parentId: desktop });
  add({
    id: uid("f"),
    name: "Resume.txt",
    type: "file",
    parentId: resume,
    ext: "txt",
    appId: "resume",
    readOnly: true,
    downloadUrl: "/profile-doc.pdf",
    downloadName: "Adarsh-Darokar-Resume.pdf",
    content:
      "ADARSH DAROKAR\n" +
      "Bhopal, Madhya Pradesh  |  +91 9303128970  |  adarshdarokar55@gmail.com  |  LinkedIn  |  GitHub\n\n" +
      "Software Engineer skilled in React.js, React Native, Node.js, Express.js, Python, Django, MongoDB,\n" +
      "REST APIs, Docker, AWS, Microservices, Claude Code, OpenAI Codex, and GitHub Copilot.\n" +
      "Experienced in building scalable full stack, mobile, and AI-powered applications with hands-on\n" +
      "expertise in leveraging AI coding tools to accelerate development, automate workflows, optimize\n" +
      "debugging, and improve software productivity. Passionate about creating production-ready solutions\n" +
      "with clean architecture, modern development practices, and practical problem solving.\n\n" +
      "──────────────────────────────────────────────\n" +
      "EXPERIENCE\n" +
      "──────────────────────────────────────────────\n\n" +
      "Sheriyans Coding School                                              Bhopal, MP\n" +
      "Full Stack Developer Intern (6 Months)                                     2025\n" +
      "  • Contributed to the development of a Job Portal using Python, Django, DRF, and React.js.\n" +
      "    Developed REST APIs, implemented JWT authentication and role-based access control, and\n" +
      "    worked on job posting, application management, dashboard features, and frontend-backend\n" +
      "    integration.\n" +
      "  • Collaborated in building scalable and maintainable application modules while following\n" +
      "    clean coding practices and project requirements.\n\n" +
      "Freelance Project                                                       Remote\n" +
      "Full Stack Developer (3-Members Team)                                      2026\n" +
      "  • Worked in a 3-member team to develop Builder AI — an AI-powered application builder using\n" +
      "    React.js, Django, and MongoDB. Contributed to frontend development, AI integration,\n" +
      "    real-time chat functionality, and API integration while collaborating closely with the\n" +
      "    backend team to deliver a seamless user experience.\n\n" +
      "──────────────────────────────────────────────\n" +
      "TECHNICAL SKILLS\n" +
      "──────────────────────────────────────────────\n\n" +
      "Languages    : Python, JavaScript (ES6+), TypeScript\n" +
      "Frontend     : React.js, Redux, GSAP, Material UI, Lenis, Tailwind CSS\n" +
      "Backend      : Node.js, Express.js, Python, Django\n" +
      "DevOps/Cloud : AWS (EC2, ECS, ECR, S3), Docker, CI/CD\n" +
      "Generative AI: OpenAI APIs, LangChain, LangGraph, RAG, Prompt Engineering\n" +
      "Databases    : MongoDB, Redis, PostgreSQL\n" +
      "Testing      : Postman, Jest\n" +
      "Tools        : Git, GitHub, Render, Vercel, GitHub Copilot, Claude Code\n\n" +
      "──────────────────────────────────────────────\n" +
      "PROJECTS\n" +
      "──────────────────────────────────────────────\n\n" +
      "Web-Unwrapper                                                              2026\n" +
      "Github : https://github.com/adarshdarokar/Unwrapp\n" +
      "Live   : https://unwrapp.onrender.com\n" +
      "  Built an AI-powered website analysis platform using React, TypeScript, Supabase, and\n" +
      "  Tailwind CSS for SEO, performance, accessibility, and tech stack analysis. Implemented\n" +
      "  AI-driven recommendations to guide optimization strategies and boost performance.\n" +
      "  Engineered secure user authentication, interactive history logs, PDF report exporting,\n" +
      "  and subscription management within a highly responsive, modern dashboard.\n\n" +
      "Devin AI — Your Own Developer                                              2026\n" +
      "Github : https://github.com/adarshdarokar/deven-ai\n" +
      "  Developed an autonomous AI coding assistant featuring real-time code generation, file\n" +
      "  system operations, and automated execution built within isolated web containers.\n" +
      "  Integrated environment sandboxing mechanisms for secure execution boundaries and\n" +
      "  designed active websocket rooms for multiplayer collaboration. Tech Stack includes\n" +
      "  React, Node.js, Express, MongoDB, Socket.io, and Redis.\n\n" +
      "──────────────────────────────────────────────\n" +
      "EDUCATION\n" +
      "──────────────────────────────────────────────\n\n" +
      "BCA, Makhanlal Chaturvedi National University                        Bhopal, MP\n" +
      "CGPA: 8.2                                                          2022 – 2025\n",
  });
  add({
    id: uid("f"),
    name: "Welcome.txt",
    type: "file",
    parentId: desktop,
    ext: "txt",
    appId: "docviewer",
    content:
      "Welcome to Adarsh Darokar's Portfolio!\n\n" +
      "• Double-click folders to open them.\n" +
      "• Right-click the desktop or inside File Explorer for actions.\n" +
      "• Drag files between folders to move them.\n\n" +
      "Explore Projects, Skills, Experience, Education, About and Contact.",
  });

  const education = add({ id: uid("f"), name: "Education", type: "folder", parentId: desktop });

  add({
    id: uid("f"),
    name: "README.md",
    type: "file",
    parentId: projects,
    ext: "md",
    appId: "docviewer",
    content:
      "# Projects\n\nSelected work by Adarsh Darokar — full stack, mobile, and AI-powered applications.",
  });
  add({
    id: uid("f"),
    name: "Web-Unwrapper.txt",
    type: "file",
    parentId: projects,
    ext: "txt",
    appId: "docviewer",
    content:
      "Web-Unwrapper (2026)\n\n" +
      "AI-powered website analysis platform for SEO, performance, accessibility, and tech stack analysis. " +
      "Features AI-driven recommendations, secure authentication, history tracking, PDF report exporting, " +
      "subscription management, and a responsive dashboard.\n\n" +
      "Tech Stack :- React, TypeScript, Supabase, Tailwind CSS\n\n" +
      "Github :- https://github.com/adarshdarokar/Unwrapp\n" +
      "Live :- https://unwrapp.onrender.com",
  });
  add({
    id: uid("f"),
    name: "Devin-AI.txt",
    type: "file",
    parentId: projects,
    ext: "txt",
    appId: "docviewer",
    content:
      "Devin AI — Your Own Developer (2026)\n\n" +
      "Autonomous AI coding assistant featuring real-time code generation, file system operations, " +
      "automated execution, isolated web containers, secure sandboxing, websocket collaboration rooms, " +
      "and multiplayer collaboration features.\n\n" +
      "Tech Stack :- React, Node.js, Express, MongoDB, Socket.io, Redis\n\n" +
      "Github :- https://github.com/adarshdarokar/deven-ai",
  });
  add({
    id: uid("f"),
    name: "Portfolio Site.txt",
    type: "file",
    parentId: projects,
    ext: "txt",
    appId: "docviewer",
    content:
      "Portfolio Site\n\n" +
      "A modern portfolio built with React, styled like Windows 11.\n\n" +
      "Github :- https://github.com/adarshdarokar/windows-11-ui\n" +
      "Preview/Live :- https://windows-11-eghg.onrender.com",
  });

  add({
    id: uid("f"),
    name: "languages.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content: "Languages\n\nPython, JavaScript (ES6+), TypeScript",
  });
  add({
    id: uid("f"),
    name: "frontend.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content:
      "Frontend\n\nReact.js, Redux, GSAP, Material UI, Lenis, Tailwind CSS",
  });
  add({
    id: uid("f"),
    name: "backend.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content: "Backend\n\nNode.js, Express.js, Python, Django",
  });
  add({
    id: uid("f"),
    name: "devops-cloud.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content: "DevOps / Cloud\n\nAWS (EC2, ECS, ECR, S3), Docker, CI/CD",
  });
  add({
    id: uid("f"),
    name: "generativeAi.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content:
      "Generative AI\n\nOpenAI APIs, LangChain, LangGraph, RAG, Prompt Engineering",
  });
  add({
    id: uid("f"),
    name: "database.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content: "Databases\n\nMongoDB, Redis, PostgreSQL",
  });
  add({
    id: uid("f"),
    name: "testing.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content: "Testing\n\nPostman, Jest",
  });
  add({
    id: uid("f"),
    name: "tools.txt",
    type: "file",
    parentId: skills,
    ext: "txt",
    appId: "docviewer",
    content:
      "Tools & Platforms\n\nGit, GitHub, Render, Vercel, GitHub Copilot, Claude Code",
  });

  add({
    id: uid("f"),
    name: "experience.txt",
    type: "file",
    parentId: experience,
    ext: "txt",
    appId: "docviewer",
    content:
      "Experience\n\n" +
      "1) Full Stack Developer Intern — Sheriyans Coding School\n" +
      "   Duration :- 6 Months (2025)\n" +
      "   Location :- Bhopal, MP\n\n" +
      "   – Contributed to the development of a Job Portal using Python, Django, DRF, and React.js.\n" +
      "   – Developed REST APIs.\n" +
      "   – Implemented JWT authentication and role-based access control.\n" +
      "   – Worked on job posting and application management features.\n" +
      "   – Built dashboard functionality.\n" +
      "   – Integrated frontend and backend systems.\n" +
      "   – Followed clean coding practices and project requirements.\n\n" +
      "2) Full Stack Developer — Freelance Project (Builder AI)\n" +
      "   Team Size :- 3 Members\n" +
      "   Duration :- 2026\n" +
      "   Location :- Remote\n\n" +
      "   – Developed an AI-powered application builder using React.js, Django, and MongoDB.\n" +
      "   – Worked on frontend development.\n" +
      "   – Integrated AI features.\n" +
      "   – Implemented real-time chat functionality.\n" +
      "   – Integrated APIs.\n" +
      "   – Collaborated closely with backend developers.",
  });

  add({
    id: uid("f"),
    name: "education.txt",
    type: "file",
    parentId: education,
    ext: "txt",
    appId: "docviewer",
    content:
      "Education\n\n" +
      "Bachelor of Computer Applications (BCA)\n" +
      "Makhanlal Chaturvedi National University — Bhopal, MP\n" +
      "Duration :- 2022 – 2025\n" +
      "CGPA :- 8.2",
  });

  add({
    id: uid("f"),
    name: "Bio.txt",
    type: "file",
    parentId: about,
    ext: "txt",
    appId: "docviewer",
    content:
      "About Adarsh Darokar\n\n" +
      "Software Engineer based in Bhopal, Madhya Pradesh.\n\n" +
      "Skilled in React.js, React Native, Node.js, Express.js, Python, Django, MongoDB, REST APIs, " +
      "Docker, AWS, Microservices, Claude Code, OpenAI Codex, and GitHub Copilot.\n\n" +
      "Experienced in building scalable full stack, mobile, and AI-powered applications. " +
      "Passionate about creating production-ready solutions with clean architecture, modern development " +
      "practices, and practical problem solving.",
  });

  add({
    id: uid("f"),
    name: "contact.txt",
    type: "file",
    parentId: contact,
    ext: "txt",
    appId: "docviewer",
    content:
      "Contact — Adarsh Darokar\n\n" +
      "Location :- Bhopal, Madhya Pradesh\n" +
      "Email :- adarshdarokar55@gmail.com\n" +
      "Phone :- +91 9303128970\n" +
      "Github :- https://github.com/adarshdarokar\n" +
      "Linkedin :- https://www.linkedin.com/in/adarshdarokar/",
  });

  return nodes;
}

const isAncestor = (nodes, ancestorId, nodeId) => {
  let cur = nodes[nodeId];
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = nodes[cur.parentId];
  }
  return false;
};

const uniqueName = (nodes, parentId, base) => {
  const siblings = Object.values(nodes).filter((n) => n.parentId === parentId);
  if (!siblings.some((n) => n.name === base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let i = 2;
  while (siblings.some((n) => n.name === `${stem} (${i})${ext}`)) i++;
  return `${stem} (${i})${ext}`;
};

export const useFS = create(
  persist(
    (set, get) => ({
      nodes: buildSeed(),

      /* Clipboard: { ids: string[], mode: 'cut' | 'copy' } | null */
      clipboard: null,
      setClipboard: (clip) => set({ clipboard: clip }),

      /* ----- selectors ----- */
      getNode: (id) => get().nodes[id],
      getChildren: (parentId) =>
        Object.values(get().nodes)
          .filter((n) => n.parentId === parentId)
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name);
          }),
      getPath: (id) => {
        const nodes = get().nodes;
        const path = [];
        let cur = nodes[id];
        while (cur) {
          path.unshift(cur);
          cur = cur.parentId ? nodes[cur.parentId] : null;
        }
        return path;
      },
      findByName: (parentId, name) =>
        Object.values(get().nodes).find((n) => n.parentId === parentId && n.name === name),
      search: (query, rootId = "root") => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const all = Object.values(get().nodes);
        const inRoot = (n) => n.id === rootId || isAncestor(get().nodes, rootId, n.id);
        return all.filter((n) => n.id !== "root" && inRoot(n) && n.name.toLowerCase().includes(q)).slice(0, 100);
      },

      /* ----- mutations ----- */
      createFolder: (parentId, name = "New folder") => {
        const id = uid("f");
        set((s) => {
          const finalName = uniqueName(s.nodes, parentId, name);
          return {
            nodes: {
              ...s.nodes,
              [id]: { id, name: finalName, type: "folder", parentId, createdAt: now(), updatedAt: now() },
            },
          };
        });
        return id;
      },

      createFile: (parentId, name = "New file.txt", content = "", appId = "notepad") => {
        const id = uid("f");
        set((s) => {
          const finalName = uniqueName(s.nodes, parentId, name);
          const dot = finalName.lastIndexOf(".");
          const ext = dot > 0 ? finalName.slice(dot + 1) : "";
          return {
            nodes: {
              ...s.nodes,
              [id]: {
                id, name: finalName, type: "file", parentId,
                ext, appId, content,
                createdAt: now(), updatedAt: now(),
              },
            },
          };
        });
        return id;
      },

      rename: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          const node = s.nodes[id];
          if (!node || node.id === "root" || node.id === "desktop") return s;
          const finalName = uniqueName(
            { ...s.nodes, [id]: { ...node, name: "__placeholder__" } },
            node.parentId,
            trimmed
          );
          return {
            nodes: { ...s.nodes, [id]: { ...node, name: finalName, updatedAt: now() } },
          };
        });
      },

      remove: (id) => {
        if (id === "root" || id === "desktop" || id === "recycle-bin") return;
        set((s) => {
          const node = s.nodes[id];
          if (!node) return s;
          if (node.parentId === "recycle-bin") {
            const toDelete = new Set([id]);
            let changed = true;
            while (changed) {
              changed = false;
              for (const n of Object.values(s.nodes)) {
                if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
                  toDelete.add(n.id);
                  changed = true;
                }
              }
            }
            const next = { ...s.nodes };
            toDelete.forEach((d) => delete next[d]);
            return { nodes: next };
          }
          const finalName = uniqueName(s.nodes, "recycle-bin", node.name);
          return {
            nodes: {
              ...s.nodes,
              [id]: { ...node, parentId: "recycle-bin", name: finalName, updatedAt: now() },
            },
          };
        });
      },

      move: (id, newParentId) => {
        set((s) => {
          const node = s.nodes[id];
          const target = s.nodes[newParentId];
          if (!node || !target || target.type !== "folder") return s;
          if (id === newParentId || node.parentId === newParentId) return s;
          if (isAncestor(s.nodes, id, newParentId)) return s;
          if (id === "root" || id === "desktop" || id === "recycle-bin") return s;
          const finalName = uniqueName(s.nodes, newParentId, node.name);
          return {
            nodes: { ...s.nodes, [id]: { ...node, parentId: newParentId, name: finalName, updatedAt: now() } },
          };
        });
      },

      /* Recursive deep-copy of a node into newParentId. Returns new top-level id. */
      copyNode: (id, newParentId) => {
        const state = get();
        const src = state.nodes[id];
        const target = state.nodes[newParentId];
        if (!src || !target || target.type !== "folder") return null;
        if (id === "root" || id === "desktop") return null;

        const additions = {};
        const cloneInto = (srcNode, parentId, nameOverride) => {
          const newId = uid("f");
          const baseName = nameOverride || srcNode.name;
          const finalName = uniqueName({ ...state.nodes, ...additions }, parentId, baseName);
          additions[newId] = {
            ...srcNode,
            id: newId,
            parentId,
            name: finalName,
            createdAt: now(),
            updatedAt: now(),
          };
          if (srcNode.type === "folder") {
            const children = Object.values(state.nodes).filter((n) => n.parentId === srcNode.id);
            children.forEach((child) => cloneInto(child, newId));
          }
          return newId;
        };

        const newTopId = cloneInto(src, newParentId);
        set((s) => ({ nodes: { ...s.nodes, ...additions } }));
        return newTopId;
      },

      writeFile: (id, content) => {
        set((s) => {
          const n = s.nodes[id];
          if (!n || n.type !== "file") return s;
          return { nodes: { ...s.nodes, [id]: { ...n, content, updatedAt: now() } } };
        });
      },

      resetFS: () => set({ nodes: buildSeed(), clipboard: null }),
    }),
    {
      name: "win11-fs-v15",
      partialize: (s) => ({ nodes: s.nodes }),
    }
  )
);
