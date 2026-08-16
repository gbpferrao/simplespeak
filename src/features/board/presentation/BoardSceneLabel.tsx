import { memo } from 'react'
import { Group, Rect, Text } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import type { Scene } from '../../../core/contracts/types'

interface BoardSceneLabelProps {
  scene: Scene
  showBackground?: boolean
  titleOpacity?: number
}

export const BoardSceneLabel = memo(function BoardSceneLabel({ scene, showBackground = false, titleOpacity = 0 }: BoardSceneLabelProps) {
  const titleWidth = scene.width - 160
  return <Group x={scene.x} y={scene.y} listening={false}>
    {showBackground && <Rect width={scene.width} height={scene.height} fill={scene.accent} opacity={0.09} cornerRadius={28} />}
    <Text x={80} y={(scene.height / 2) - 52} width={titleWidth} height={104} text={scene.name} fill={scene.accent} fontFamily="Inter, system-ui, sans-serif" fontSize={82} fontStyle="bold" letterSpacing={-1.8} align="center" verticalAlign="middle" ellipsis opacity={titleOpacity} />
  </Group>
})
