import { saveAs } from 'file-saver'

export function toJSON(graph) {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
  saveAs(blob, 'fam-export.json')
}

export function toMarkdown(graph) {
  const lines = ['# FAM Architecture Document\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push(`**Pattern:** ${node.pattern}`)
    lines.push(`**Risk:** ${node.riskLevel}`)
    lines.push(`**Effort:** ${node.effortEstimate}`)
    lines.push(`**Business Reason:** ${node.businessReason}`)
    lines.push(`**Data Flow:** ${node.dataFlow}`)
    lines.push(`**NFR Tags:** ${node.nfrTags.join(', ')}`)
    lines.push(`**Dependencies:** ${node.dependencies.join(', ') || 'None'}`)
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  saveAs(blob, 'fam-architecture.md')
}

export function toScaffold(graph) {
  const lines = ['# FAM Folder Scaffold\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push('```')
    lines.push(node.folderStructure)
    lines.push('```')
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  saveAs(blob, 'scaffold.txt')
}

export function toPrompts(graph) {
  const lines = ['# FAM Agent Prompts\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push(node.agentPrompt)
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  saveAs(blob, 'agent-prompts.txt')
}
