export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Qualified' | 'In Progress' | 'Rejected' | 'Hired';
  score: number;
  appliedDate: string;
  avatar?: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'Open' | 'Closed' | 'Draft';
}