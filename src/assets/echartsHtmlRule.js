/* eslint-disable */
// 核心代码来自：https://github.com/markdown-it/markdown-it/blob/master/lib/rules_block/html_block.mjs
// HTML block
import markdownToMindMap from "./markdownToMindMapHtml"

export default function html_block(state, startLine, endLine, silent) {
  /**
   * 得到
   * ```
   * :mps
   * xxxx 思维导图具体内容
   * mpe
   * ```
   * 中的内容
   * 由于是在流式中渲染的，因此开头符号要尽可能断 mps=mindmapstart
   */
  const startReg = /^:echarts\s*/is
  const endReg = /^echarts\s*/is
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  let max = state.eMarks[startLine]

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false }

  if (!state.md.options.html) { return false }


  let lineText = state.src.slice(pos, max)

  if (!startReg.test(lineText)) return false


  let nextLine = startLine + 1

  // If we are here - we detected HTML block.
  // Let's roll down till block end.

  // 开头匹配:::mindMap
  // 然后下面这里在匹配到结束的标志mindMapEnd之前，将中间行的文本拼接起来
  if (!endReg.test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break }

      pos = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]
      // 此时lineText是下一行的文本了
      lineText = state.src.slice(pos, max)

      if (endReg.test(lineText)) {
        if (lineText.length !== 0) { nextLine++ }
        break
      }
    }
  }

  state.line = nextLine

  const token = state.push('html_block', '', 0)
  token.map = [startLine, nextLine]
  const echartsHtml = state.getLines(startLine, nextLine, state.blkIndent, true)
  // console.error('echartsHtml',echartsHtml);
  if (echartsHtml.startsWith(':echarts') && echartsHtml.endsWith('echarts\n')) {
    let timestamp = Date.now()
    token.content = `<iframe prefix="fun_${Date.now()}" src="./#/mdTestOnly?iframe=true" style="width:100%;height:400px;border:none;overflow:auto;"></iframe>`
    window[`fun_${timestamp}`] = echartsHtml

  } else {
    token.content = 'echarts加载中...'
  }


  return true
}
