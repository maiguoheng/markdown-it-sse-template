/* eslint-disable */
const doingLatexToHtmlMap = {} // 是否正在等待转换
const latexToHtmlMap = {} // 已转换的latex结果储存

const preRenderLatex = (latex, isBlock = true) => {
  if (!latex) return
  latex = latex.trim()
  if (!doingLatexToHtmlMap[latex]) {
    doingLatexToHtmlMap[latex] = latex
    // 在页面中计算公式。方法：在页面中生成一个看不见的元素，填加latex公式，渲染后
    const div = document.createElement('div')
    if (isBlock) {
      div.innerHTML = `\\[${latex}\\]`
    } else {
      div.innerHTML = `\\(${latex}\\)`
    }
    div.style.opacity = '0'
    div.style.position = 'absolute'
    // 限制宽度，避免公式过长，导致回答溢出。3rem - 0.3rem = 2.7rem
    //其中3rem是sse回答元素中的最大值,0.3rem是ol标签的padding-start，避免公式在单个ol标签下超出。如果是多级ol标签（多个padding 0.3rem），还是有可能溢出的，暂不处理这种
    div.style.maxWidth = '2.7rem'
    document.body.append(div)

    window.loadMathJax(div, () => {
      // 移除掉div里的script，避免被重复渲染
      const scripts = div.querySelectorAll('script')
      scripts.forEach(script => {
        script.remove()
      })
      doingLatexToHtmlMap[latex] = null

      latexToHtmlMap[latex] = div.innerHTML
      div.remove()
    })
  }
}
const hasLatex = (latex) => !!latexToHtmlMap[latex.trim()]
const getLatex = (latex) => latexToHtmlMap[latex.trim()]

export default {
  preRenderLatex,
  hasLatex,
  getLatex
}