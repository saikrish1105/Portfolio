export interface ProjectLink {
  label: string;
  url: string;
  type?: 'github' | 'live' | 'etherscan' | 'external';
}

export interface Project {
  id: string;
  title: string;
  category: string;
  shortSummary: string;
  detailedDescription: string;
  techStack: string[];
  links: ProjectLink[];
  contractAddresses?: { name: string; address: string; url: string }[];
}

export interface Internship {
  company: string;
  location: string;
  role: string;
  period: string;
  highlights: string[];
  techStack: string[];
}

export interface PortfolioData {
  driver: {
    name: string;
    title: string;
    motto: string;
    socials: { github: string; linkedin: string; resume: string };
  };
  sector1_projects: Project[];
  sector2_experience: {
    education: {
      institution: string;
      degree: string;
      period: string;
      leadership: string;
    };
    internships: Internship[];
  };
  sector3_achievements: {
    hackathons: { title: string; description: string; link?: string }[];
    certifications: { title: string; issuer: string; description: string }[];
    creative: {
      title: string;
      subtitle: string;
      description: string;
      mediaType: 'video' | 'social';
      embedUrl?: string;
      links?: { label: string; url: string }[];
    }[];
  };
}

export const PORTFOLIO_DATA: PortfolioData = {
  driver: {
    name: 'Sai Krish',
    title: 'Computer Engineer',
    motto: 'Either be a jack of all or be a master of all',
    socials: {
      github: 'https://github.com/saikrish1105',
      linkedin: 'https://www.linkedin.com/in/sai-krish-naidu-54550521a/',
      resume:
        'https://docs.google.com/document/d/1rYPHLZ_kHifX_GfpakhMY4BWfowXJE9CbOE5pzABoMQ/edit?usp=sharing',
    },
  },

  sector1_projects: [
    {
      id: 'homelab-infrastructure',
      title: 'Self-Hosted Homelab Infrastructure',
      category: 'DEVOPS & SYSTEMS',
      shortSummary: 'Personal high-availability homelab built from repurposed hardware with reverse proxy exposure.',
      detailedDescription:
        'Converted custom desktop PC hardware into a secure, self-hosted homelab server setup. Configured reverse proxies for secure public endpoint exposure, hosting multiple web applications including this 3D portfolio website.',
      techStack: ['Linux Server', 'Reverse Proxy (Nginx/Traefik)', 'Self-Hosting', 'Networking', 'Docker'],
      links: [],
    },
    {
      id: 'mine-safety-helmet-patent',
      title: 'Edge-Intelligent Wearable Mine Safety Helmet',
      category: 'PATENT & HARDWARE ML',
      shortSummary:
        'Edge-intelligent wearable helmet fusing gas, physiological, motion, and acoustic sensors with ML hazard prediction.',
      detailedDescription:
        'Designed in response to over 226 reported coal and lignite mine fatalities between 2020 and 2024. Fuses multi-sensor telemetry (gas, physiological, motion, acoustic, vibration) with an edge ML model to predict underground hazards before safety thresholds are breached. Backed by adaptive calibration and hazard-responsive LoRa long-range communication.',
      techStack: ['Edge ML', 'LoRa Communication', 'Sensor Fusion', 'Embedded Systems', 'IoT', 'Microcontrollers'],
      links: [
        {
          label: 'View Patent Update & Study',
          url: 'https://www.linkedin.com/feed/update/urn:li:activity:7487728729616646144/',
          type: 'external',
        },
      ],
    },
    {
      id: 'requirements-refactor-server',
      title: 'Requirements Refactor & Test Generation Server',
      category: 'AGENTIC AI & GRAPH SYSTEMS',
      shortSummary:
        'Completely offline graph-based agentic system for requirement refactoring, test generation, and impact analysis.',
      detailedDescription:
        'A completely air-gapped, offline requirement refactoring graph-based agentic system. Automatically generates black-box test cases, constructs requirement impact graphs, and provides sandbox test coverage analysis for enterprise codebases without relying on external cloud LLM APIs.',
      techStack: ['Python', 'Graph-Based Agents', 'Offline LLMs', 'Software Testing Automation', 'Codebase Analysis'],
      links: [
        {
          label: 'GitHub Repository',
          url: 'https://github.com/saikrish1105/Requirements-Refactor-Server',
          type: 'github',
        },
      ],
    },
    {
      id: 'webguard-ai',
      title: 'WebGuard-AI',
      category: 'CYBERSECURITY & DEEP LEARNING',
      shortSummary:
        'Behavioral Anomaly Detection system for Web Application Security using dynamic sequence modeling.',
      detailedDescription:
        'A dynamic web application security system that learns per-entity normal access patterns and detects behavioral deviations in real time using a GRU (Gated Recurrent Unit) sequence model. Classifies complex intrusions such as brute force, lateral movement, and credential misuse with explainable, analyst-ready risk scores.',
      techStack: ['Python', 'PyTorch', 'GRU Sequence Models', 'Cybersecurity', 'Anomaly Detection', 'Deep Learning'],
      links: [
        { label: 'GitHub Repository', url: 'https://github.com/saikrish1105/WebGaurd-AI', type: 'github' },
      ],
    },
    {
      id: 'solidity-smart-contracts',
      title: 'Solidity Smart Contract Suite',
      category: 'WEB3 & BLOCKCHAIN',
      shortSummary: 'Self-written smart contracts delivering automated, trustless, and transparent blockchain execution.',
      detailedDescription:
        'A compilation of 4 self-written smart contracts in Solidity providing automatic execution, trustless transactions, and permanent transparency by turning legal or procedural terms into verifiable code on the Sepolia Ethereum testnet.',
      techStack: ['Solidity', 'Ethereum', 'Sepolia Testnet', 'Smart Contracts', 'Web3.js / Ethers.js'],
      links: [
        {
          label: 'GitHub Repository',
          url: 'https://github.com/saikrish1105/Solidity-Smart-Contracts',
          type: 'github',
        },
      ],
      contractAddresses: [
        {
          name: 'Lottery Contract',
          address: '0xc6d35c73a5888a57ff126cda1328b9fb27536bb0',
          url: 'https://sepolia.etherscan.io/address/0xc6d35c73a5888a57ff126cda1328b9fb27536bb0',
        },
        {
          name: 'MultiSigEscrow Contract',
          address: '0x7ac85b28a0b40922a2d12d5c327f40d9c55c6992',
          url: 'https://sepolia.etherscan.io/address/0x7ac85b28a0b40922a2d12d5c327f40d9c55c6992#writeContract',
        },
      ],
    },
    {
      id: 'quest-life',
      title: 'Quest-Life',
      category: 'FULL-STACK GAMIFIED APP',
      shortSummary: 'Gamified habit tracker that transforms daily tasks and personal goals into RPG quests.',
      detailedDescription:
        'A swipe-friendly gamified productivity app. Converts daily tasks and personal habits into RPG quests where users complete goals, earn points, unlock rewards, tackle dungeon challenges, and level up with custom themes and local offline data storage.',
      techStack: ['React', 'JavaScript', 'Tailwind CSS', 'Local Storage API', 'PWA'],
      links: [
        { label: 'Live Application', url: 'https://questlife.krish.systems/', type: 'live' },
        { label: 'GitHub Repository', url: 'https://github.com/saikrish1105/Quest-Life', type: 'github' },
      ],
    },

  ],

  sector2_experience: {
    education: {
      institution: 'VIT Vellore',
      degree: 'B.Tech in Computer Science & Engineering',
      period: '2023 – 2027',
      leadership:
        'Head of LEO CLUB VIT (Feb 2025 – Feb 2026): Led and executed large-scale social outreach initiatives (medical camps, orphanage visits, community drives), managing cross-functional teams of 40+ volunteers, driving membership growth, and establishing strategic community partnerships.',
    },
    internships: [
      {
        company: 'Defence Research & Development Organisation (DRDO) – ADE',
        location: 'Bengaluru, Karnataka',
        role: 'Generative AI Intern',
        period: 'May 2026 – July 2026',
        highlights: [
          'Optimized multi-user LLM inference on a shared DGX cluster (8x32GB GPUs) by splitting GPU allocation between OpenWebUI, direct inferencing, and training workloads.',
          'Tuned inference via vLLM and Ollama, increasing concurrent user capacity from 4 to 8-9 users while significantly reducing request wait times.',
          'Developed an air-gapped graphical agentic system for automated requirement refactoring and test generation as the main project deliverable.',
        ],
        techStack: ['vLLM', 'Ollama', 'DGX Cluster (8x32GB GPUs)', 'OpenWebUI', 'Agentic Systems', 'Python'],
      },
      {
        company: 'LTI Mindtree – AI Core Center of Excellence (CoE)',
        location: 'Bengaluru, Karnataka',
        role: 'Gen AI Intern',
        period: 'May 2025 – July 2025',
        highlights: [
          'Engineered a multi-agent e-commerce platform using CrewAI, integrating BigCommerce, ServiceNow MCP, and Intel OPEA microservices.',
          'Constructed a scalable enterprise RAG pipeline utilizing NVIDIA NIM, MongoDB, and Docker for high-speed query intelligence.',
          'Recognized as a Top 12 Solution out of enterprise submissions in an internal hackathon.',
        ],
        techStack: ['CrewAI', 'NVIDIA NIM', 'MongoDB', 'Docker', 'ServiceNow MCP', 'Intel OPEA', 'RAG'],
      },
    ],
  },

  sector3_achievements: {
    hackathons: [
      {
        title: 'Winner – Caterpillar Campus Hackathon',
        description:
          'Won 1st place as a fresher team by building a visual AI data-logging application. Automatically analyzed machinery photos to evaluate wear-and-tear conditions and provided live alerts and deterioration forecasts using LLMs.',
        link: 'https://github.com/D-Yuva/Butterfliy',
      },
    ],
    certifications: [
      {
        title: 'OCI Generative AI Professional',
        issuer: 'Oracle Cloud Infrastructure',
        description:
          'Official enterprise certification validating advanced skills in LLM architecture, fine-tuning, retrieval-augmented generation (RAG), and cloud AI deployment.',
      },
    ],
    creative: [
      {
        title: 'Winner – Short Film Competition',
        subtitle: "'666' - Original Short Fantasy Film",
        description:
          'Written and directed an original fantasy short film highlighting smoking awareness through cinematic visual storytelling.',
        mediaType: 'video',
        embedUrl: 'https://www.youtube.com/embed/i-RFKE2IXZU',
        links: [{ label: 'Watch on YouTube', url: 'https://youtu.be/i-RFKE2IXZU?si=meBpHE-TPLfV1Vi8' }],
      },
      {
        title: 'Music Production & Performing',
        subtitle: 'Trident Musicals & Guitar Covers',
        description:
          'Arrange, record, and produce guitar-driven music covers and arrangements published across YouTube and Instagram.',
        mediaType: 'social',
        links: [
          { label: 'YouTube Channel (@TRIDENTMUSICALS)', url: 'https://www.youtube.com/@TRIDENTMUSICALS' },
          { label: 'Instagram (@saikrish_music)', url: 'https://www.instagram.com/saikrish_music/' },
        ],
      },
    ],
  },
};
