import { memo } from 'react'
import { Group, Rect, Text } from 'react-konva/lib/ReactKonvaCore'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import type { Scene } from '../../../core/contracts/types'

interface BoardSceneLabelProps {
  scene: Scene
  anchoredCount: number
  cardCount: number
}

export const BoardSceneLabel = memo(function BoardSceneLabel({ scene, anchoredCount, cardCount }: BoardSceneLabelProps) {
  const labelTextWidth = Math.max(120, scene.width - 125)

  return <Group x={scene.x} y={scene.y} listening={false}>
    <Rect x={8} y={42} width={scene.width - 16} height={scene.height - 50} stroke={scene.accent} strokeWidth={2} dash={[5, 7]} cornerRadius={24} opacity={0.28} />
    <Rect x={0} y={0} width={scene.width} height={48} fill="#ffffff" stroke={scene.accent} strokeWidth={2} cornerRadius={11} shadowColor="#26344a" shadowBlur={5} shadowOffsetY={3} shadowOpacity={0.08} />
    <Rect x={10} y={9} width={9} height={30} fill={scene.accent} cornerRadius={5} />
    <Text x={28} y={7} width={labelTextWidth} text={scene.kicker} fill="#738096" fontFamily="Inter, system-ui, sans-serif" fontSize={8} fontStyle="bold" letterSpacing={0.6} ellipsis />
    <Text x={28} y={23} width={labelTextWidth} text={scene.name} fill="#26344a" fontFamily="Inter, system-ui, sans-serif" fontSize={14} fontStyle="bold" ellipsis />
    <Text x={scene.width - 82} y={19} width={62} text={`${anchoredCount}/${cardCount}`} fill="#52627a" fontFamily="Inter, system-ui, sans-serif" fontSize={10} fontStyle="bold" align="right" />
  </Group>
})
