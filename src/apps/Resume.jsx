import { Download, Mail, Phone, MapPin, Github, Linkedin, Briefcase, GraduationCap, Code2, FolderGit2, User } from "lucide-react";
import { useFS } from "@/os/fs";

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-md bg-primary/15 text-primary grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground">
        {title}
      </h2>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/70 border border-border text-[11.5px] text-foreground/90">
      {children}
    </span>
  );
}

function SkillRow({ label, items }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 py-1.5">
      <div className="sm:w-36 shrink-0 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <Chip key={i}>{i}</Chip>
        ))}
      </div>
    </div>
  );
}

function ExperienceItem({ role, company, location, period, bullets }) {
  return (
    <div className="relative pl-5 pb-5 border-l border-border last:pb-0">
      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-[14.5px] font-semibold text-foreground leading-tight">{role}</h3>
          <p className="text-[12.5px] text-primary font-medium">{company}</p>
        </div>
        <div className="text-right text-[11.5px] text-muted-foreground">
          <div>{period}</div>
          <div>{location}</div>
        </div>
      </div>
      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-foreground/85">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectCard({ name, year, github, live, description }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 hover:bg-card/70 transition-colors">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-foreground">{name}</h3>
        <span className="text-[11.5px] text-muted-foreground">{year}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            <Github className="w-3 h-3" /> GitHub
          </a>
        )}
        {live && (
          <a href={live} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Live ↗
          </a>
        )}
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-foreground/85">{description}</p>
    </div>
  );
}

export default function Resume({ props }) {
  const fileId = props?.fileId || null;
  const downloadUrl = useFS((s) => (fileId ? s.nodes[fileId]?.downloadUrl : null)) || "/profile-doc.pdf";
  const downloadName = useFS((s) => (fileId ? s.nodes[fileId]?.downloadName : null)) || "Adarsh-Darokar-Resume.pdf";

  const handleDownload = async () => {
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border bg-muted/30 shrink-0">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Resume</span>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[11.5px] font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      {/* Scrollable resume */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
          {/* Header */}
          <header className="pb-6 mb-7 border-b border-border">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              ADARSH DAROKAR
            </h1>
            <p className="mt-1.5 text-[13px] text-primary font-medium uppercase tracking-[0.22em]">
              Software Engineer
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Bhopal, Madhya Pradesh
              </span>
              <a href="tel:+919303128970" className="inline-flex items-center gap-1.5 hover:text-primary">
                <Phone className="w-3.5 h-3.5" /> +91 9303128970
              </a>
              <a href="mailto:adarshdarokar55@gmail.com" className="inline-flex items-center gap-1.5 hover:text-primary">
                <Mail className="w-3.5 h-3.5" /> adarshdarokar55@gmail.com
              </a>
              <a href="https://www.linkedin.com/in/adarshdarokar/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
              <a href="https://github.com/adarshdarokar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-7">
            <SectionHeader icon={User} title="Summary" />
            <p className="text-[13px] leading-relaxed text-foreground/85">
              Software Engineer skilled in React.js, React Native, Node.js, Express.js, Python, Django,
              MongoDB, REST APIs, Docker, AWS, Microservices, Claude Code, OpenAI Codex, and GitHub Copilot.
              Experienced in building scalable full stack, mobile, and AI-powered applications with hands-on
              expertise in leveraging AI coding tools to accelerate development, automate workflows, optimize
              debugging, and improve software productivity. Passionate about creating production-ready
              solutions with clean architecture, modern development practices, and practical problem solving.
            </p>
          </section>

          {/* Experience */}
          <section className="mb-7">
            <SectionHeader icon={Briefcase} title="Experience" />
            <div className="space-y-1">
              <ExperienceItem
                role="Full Stack Developer Intern (6 Months)"
                company="Sheriyans Coding School"
                location="Bhopal, MP"
                period="2025"
                bullets={[
                  "Contributed to the development of a Job Portal using Python, Django, DRF, and React.js. Developed REST APIs, implemented JWT authentication and role-based access control, and worked on job posting, application management, dashboard features, and frontend-backend integration.",
                  "Collaborated in building scalable and maintainable application modules while following clean coding practices and project requirements.",
                ]}
              />
              <ExperienceItem
                role="Full Stack Developer (3-Members Team)"
                company="Freelance Project"
                location="Remote"
                period="2026"
                bullets={[
                  "Worked in a 3-member team to develop Builder AI — an AI-powered application builder using React.js, Django, and MongoDB. Contributed to frontend development, AI integration, real-time chat functionality, and API integration while collaborating closely with the backend team to deliver a seamless user experience.",
                ]}
              />
            </div>
          </section>

          {/* Skills */}
          <section className="mb-7">
            <SectionHeader icon={Code2} title="Technical Skills" />
            <div className="divide-y divide-border/60">
              <SkillRow label="Languages" items={["Python", "JavaScript (ES6+)", "TypeScript"]} />
              <SkillRow label="Frontend" items={["React.js", "Redux", "GSAP", "Material UI", "Lenis", "Tailwind CSS"]} />
              <SkillRow label="Backend" items={["Node.js", "Express.js", "Python", "Django"]} />
              <SkillRow label="DevOps / Cloud" items={["AWS (EC2, ECS, ECR, S3)", "Docker", "CI/CD"]} />
              <SkillRow label="Generative AI" items={["OpenAI APIs", "LangChain", "LangGraph", "RAG", "Prompt Engineering"]} />
              <SkillRow label="Databases" items={["MongoDB", "Redis", "PostgreSQL"]} />
              <SkillRow label="Testing" items={["Postman", "Jest"]} />
              <SkillRow label="Tools" items={["Git", "GitHub", "Render", "Vercel", "GitHub Copilot", "Claude Code"]} />
            </div>
          </section>

          {/* Projects */}
          <section className="mb-7">
            <SectionHeader icon={FolderGit2} title="Projects" />
            <div className="grid gap-3">
              <ProjectCard
                name="Web-Unwrapper"
                year="2026"
                github="https://github.com/adarshdarokar/Unwrapp"
                live="https://unwrapp.onrender.com"
                description="Built an AI-powered website analysis platform using React, TypeScript, Supabase, and Tailwind CSS for SEO, performance, accessibility, and tech stack analysis. Implemented AI-driven recommendations to guide optimization strategies and boost performance. Engineered secure user authentication, interactive history logs, PDF report exporting, and subscription management within a highly responsive, modern dashboard."
              />
              <ProjectCard
                name="Devin AI — Your Own Developer"
                year="2026"
                github="https://github.com/adarshdarokar/deven-ai"
                description="Developed an autonomous AI coding assistant featuring real-time code generation, file system operations, and automated execution built within isolated web containers. Integrated environment sandboxing mechanisms for secure execution boundaries and designed active websocket rooms for multiplayer collaboration. Tech Stack includes React, Node.js, Express, MongoDB, Socket.io, and Redis."
              />
            </div>
          </section>

          {/* Education */}
          <section>
            <SectionHeader icon={GraduationCap} title="Education" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">
                  BCA, Makhanlal Chaturvedi National University
                </h3>
                <p className="text-[12.5px] text-muted-foreground">Bhopal, MP</p>
              </div>
              <div className="text-right text-[12px] text-muted-foreground">
                <div className="text-foreground font-medium">CGPA: 8.2</div>
                <div>2022 – 2025</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
