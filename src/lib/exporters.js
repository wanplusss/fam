import { saveAs } from 'file-saver'

export function toJSON(graph) {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
  saveAs(blob, 'recode-export.json')
}

export function toMarkdown(graph) {
  const lines = ['# Recode Architecture Document\n']
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
  saveAs(blob, 'recode-architecture.md')
}

export function toScaffold(graph) {
  const lines = ['# Recode Folder Scaffold\n']
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
  const lines = ['# Recode Agent Prompts\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push(node.agentPrompt)
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  saveAs(blob, 'agent-prompts.txt')
}

export function toBlueprint(graph) {
  const nodeById = Object.fromEntries(graph.nodes.map((n) => [n.id, n]))
  const lines = ['# Project Blueprint\n']

  lines.push('## Directory Overview\n')
  for (const node of graph.nodes) {
    lines.push(`### ${node.label}`)
    lines.push('```')
    lines.push(node.folderStructure)
    lines.push('```')
    if ((node.ownedFiles ?? []).length > 0) {
      lines.push(`**Owned files:**`)
      for (const f of node.ownedFiles) lines.push(`- \`${f}\``)
    }
    if ((node.sharedFiles ?? []).length > 0) {
      lines.push(`**Imports from other nodes:**`)
      for (const sf of node.sharedFiles) {
        const owner = nodeById[sf.ownedBy]?.label ?? sf.ownedBy
        const exp = sf.exportName ? ` — \`${sf.exportName}\`` : ''
        lines.push(`- \`${sf.file}\` (owned by **${owner}**)${exp}`)
      }
    }
    lines.push('')
  }

  lines.push('---\n')
  lines.push('## Node Details\n')

  for (const node of graph.nodes) {
    lines.push(`### ${node.label}`)
    lines.push(`| Field | Value |`)
    lines.push(`|-------|-------|`)
    lines.push(`| Pattern | ${node.pattern} |`)
    lines.push(`| Risk | ${node.riskLevel} |`)
    lines.push(`| Effort | ${node.effortEstimate} |`)
    lines.push(`| NFR Tags | ${node.nfrTags.join(', ')} |`)
    lines.push(`| Dependencies | ${node.dependencies.map((d) => nodeById[d]?.label ?? d).join(', ') || 'None'} |`)
    lines.push('')
    lines.push(`**Business Reason:** ${node.businessReason}`)
    lines.push('')
    lines.push(`**Data Flow:** ${node.dataFlow}`)
    lines.push('')
    lines.push(`**Agent Prompt:**`)
    lines.push('```')
    lines.push(node.agentPrompt)
    lines.push('```')
    lines.push('')
  }

  lines.push('---\n')
  lines.push('## Dependencies Graph\n')
  for (const edge of graph.edges) {
    const src = nodeById[edge.source]?.label ?? edge.source
    const tgt = nodeById[edge.target]?.label ?? edge.target
    const tgtNode = nodeById[edge.target]
    const passed = (tgtNode?.sharedFiles ?? [])
      .filter((sf) => sf.ownedBy === edge.source)
      .map((sf) => sf.exportName ? `\`${sf.file.split('/').pop()} → ${sf.exportName}\`` : `\`${sf.file.split('/').pop()}\``)
    const passedStr = passed.length > 0 ? ` [passes: ${passed.join(', ')}]` : ''
    lines.push(`- **${src}** → **${tgt}**${passedStr} _(${edge.label ?? ''})_`)
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  saveAs(blob, 'recode-blueprint.md')
}
