export interface Fighter {
  id: number
  name: string
  slug: string
  created_at: string
  stats: Record<string, string>
}

export interface Move {
  id: number
  fighter_id: number
  section: string
  move_name: string
  input?: string
  startup?: string
  active?: string
  recovery?: string
  total_frames?: string
  on_hit?: string
  on_block?: string
  damage?: string
  guard?: string
  cancel?: string
  notes?: string
  gif_url?: string
  gif_path?: string
}

export interface QuizQuestion {
  move_id: number
  move_name: string
  section: string
  gif_url?: string
  gif_path?: string
  question: string
  choices: string[]
  answer: string
  fighter_slug: string
  question_type: string   // "startup" | "on_block" | "on_hit" | "punish"
  on_block_value?: string
}
