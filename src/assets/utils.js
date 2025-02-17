import md from './markdownIt'
import { nextTick } from 'vue';

// 转换markdown
const transformMarkdown = (text, config = {}) => {
  const {
    allowEmpty = false,
    appendCursor = true,
    saveLatexRender = true,
    timestampInCursor = false
  } = config
  if (!text && !allowEmpty) return ''
  text = replaceLatexStartAndEnd(text)
  text = handleMdRenderBadCase(text)
  let result = md.render(text, { saveLatexRender })
  // 渲染结果的结尾的光标
  if (appendCursor) {
    let div = document.createElement('div')
    div.innerHTML = result
    let lastElement = findDeepestLastChild(div)
    if (lastElement) {
      lastElement.innerHTML += timestampInCursor ? `<span class="sse_cursor" t=${Date.now()}></span>` : '<span class="sse_cursor"></span>'
      result = div.innerHTML
    }
  }
  // md.render后，替换回来
  result = result.replace(/latexStartBlock/g, "\\\[ ").replace(/latexEndBlock/g, " \\\]")
  result = result.replace(/latexStartInline/g, "\\\( ").replace(/latexEndInline/g, " \\\)")
  // 将其内部的多个连续空行，替换成一个。因为题目识别时候，会有html+body标签，导致多个大段空白
  result = result.replace(/(.*)?/gs, match => {
    return match.replace(/\s{2,}/gs, '')
  })
  return result
}
// 找出一段文本中，适合添加光标的元素。注意，需要考虑textNode的情况
function findDeepestLastChild(element) {
  let childNodes = element.childNodes
  if (!childNodes.length) {
    return element
  }
  for (let i = childNodes.length - 1; i >= 0; i--) {
    let node = childNodes[i]
    // 
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      // 不是纯空格或换行符号
      return node.parentNode
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      return findDeepestLastChild(node)
    }
  }
}
// 将latex公式的开始与结束符号标记后返回
const replaceLatexStartAndEnd = function (text) {
  if (!text) return ''
  // 下面的替换，是为了处理latex公式
  // 要点：
  // 1. (.*?)中的?要保留，这样保证是非贪婪匹配，保证匹配内容尽可能短，避免两个latex公式之间的内容被匹配
  // 2.修饰符s，表示.可以匹配换行符，避免换行符导致的匹配失败
  const regExpArrBlock = [/\\\[(.*?)\\\]/gs, /\\\$\$(.*?)\\\$\$/gs]// \[ a+b \] 与\$$ a+b \$$
  const regExpArrInline = [/\\\((.*?)\\\)/gs, /\$\$(.*?)\$\$/gs, /\$(.*?)\$/gs] //\( a+b \) 与$$ a+b $$ 与 $a+b$
  regExpArrBlock.forEach((regExp) => {
    text = text.replace(regExp, 'latexStartBlock $1 latexEndBlock')
  })
  regExpArrInline.forEach((regExp) => {
    text = text.replace(regExp, 'latexStartInline $1 latexEndInline')
  })
  return text
}

const handleMdRenderBadCase = function (text) {
  //badCase描述: 文本"有以下三点\n- "渲染时，有以下三点会被处理成h标签，导致加粗变大，
  // 实际的要展示的文本中，"\n - "后面有其它内容时，“有以下三点”就会被处理成p标签，导致样式不一致，sse输出时看起来文字先h标签，后p标签，闪动
  // 处理方法：末尾为\n-时，且后面的内容为空格时，替换为换行符号
  const reg = /\n\s*-\s*$/g
  text = text.replace(reg, '\n')
  return text
}

const removeSseCursor = (delay = false, element) => {
  function remove() {
    let ele = element || document
    ele?.querySelectorAll('.sse_cursor').forEach((item) => {
      item.remove()
    })
  }
  delay ? nextTick(remove) : remove()
}

export default {
  transformMarkdown,
  removeSseCursor
}
