import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EvaluationScoreGuide } from './EvaluationScoreGuide'

describe('EvaluationScoreGuide', () => {
  it('renders the shared five-point meanings and decimal-score guidance', () => {
    const markup = renderToStaticMarkup(<EvaluationScoreGuide />)

    expect(markup).toContain('1~5점 사이에서 0.1점 단위로 입력할 수 있습니다.')
    expect(markup).toContain('1점</strong> 매우 부족')
    expect(markup).toContain('2점</strong> 부족')
    expect(markup).toContain('3점</strong> 보통')
    expect(markup).toContain('4점</strong> 우수')
    expect(markup).toContain('5점</strong> 매우 우수')
  })
})
