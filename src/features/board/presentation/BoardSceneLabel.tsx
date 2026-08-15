import { memo } from 'react'
import { Group, Rect, Text } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import type { Scene } from '../../../core/contracts/types'

interface BoardSceneLabelProps {
  scene: Scene
}

export const BoardSceneLabel = memo(function BoardSceneLabel({ scene }: BoardSceneLabelProps) {
  return <Group x={scene.x} y={scene.y} listening={false}>
    <Rect width={scene.width} height={scene.height} fill={scene.accent} opacity={0.09} cornerRadius={28} />
    <Text x={30} y={26} width={scene.width - 60} text={scene.name} fill={scene.accent} fontFamily="Inter, system-ui, sans-serif" fontSize={26} fontStyle="bold" letterSpacing={-0.8} ellipsis />
  </Group>
})
