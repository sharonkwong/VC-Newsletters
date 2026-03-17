export interface Source {
  title: string;
  url: string;
  type: string;
  trending: boolean;
  publishedDate?: string;
}

export interface Competitor {
  name: string;
  description: string;
  momentum: "rising" | "stable" | "declining";
  funding: string;
  stage: string;
  newsCount: number;
}

export interface EmergingCompany {
  name: string;
  description: string;
  signals: string[];
  mentionTrend: "accelerating" | "growing" | "new";
  fundingStage: string;
  foundedYear: number;
  sector: string;
}

export interface ViewPoint {
  title: string;
  description: string;
}

export interface TopEntity {
  name: string;
  detail: string;
  relevance: string;
}

export interface Newsletter {
  topic: string;
  date: string;
  generatedDate: string;
  updatedDate: string | null;
  frequency: string;
  executiveSummary: string[];
  themes: string[];
  sources: Source[];
  landscape: string;
  currentState: string;
  predictions: string;
  investmentInsights: string;
  competitors: Competitor[];
  emergingCompanies: EmergingCompany[];
  consensus: ViewPoint[];
  contrarian: ViewPoint[];
  topPeople: TopEntity[];
  topProducts: TopEntity[];
  topCompanies: TopEntity[];
}

export interface HistoryItem {
  id: string;
  topic: string;
  date: string;
  frequency: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  saved?: boolean;
}
