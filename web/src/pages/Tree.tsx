import { EvolutionTree } from '../components/EvolutionTree'
import { SectionTitle } from '../components/ui'
import { useAppStore } from '../store/useAppStore'

export function Tree() {
  const pet = useAppStore((s) => s.pet)

  return (
    <div className="space-y-5">
      <SectionTitle accent={1} rainbow>
        ต้นไม้วิวัฒนาการ
      </SectionTitle>
      <EvolutionTree pet={pet} />
    </div>
  )
}
