/* eslint-disable */
import markdownIt from 'markdown-it'
import markdownToMindMapRule from './markdownMindMapRule.js'
import Prism from 'prismjs'
// 加载markdown依赖
import 'prismjs/components/prism-markdown.min.js';
import preUtils from './preRenderLatexUtils'
// 用于直接替换latex公式的html，key:匹配到的latex文本，value:替换的html
// 
const md = markdownIt({
  html: true,
  highlight: function (str, lang) {
    // 检查 Prism.js 是否支持该语言
    if (lang && Prism.languages[lang]) {
      try {
        // 尝试高亮特定语言
        return `<pre class="language-${lang}"><code>${Prism.highlight(str, Prism.languages[lang], lang)}</code></pre>`;
      } catch (error) {
        // 如果高亮失败，打印错误信息
        console.error('Prism highlight error for language:', lang, error);
        // 回退到纯文本代码块
        return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    } else {
      // 如果语言不被支持，使用通用语言 'none'
      console.warn(`Prism does not support language: ${lang}. Falling back to plain text.`);
      return `<pre class="language-none"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    }
  }
})


// 自定义渲染函数
// 目前仅在chatList加了，历史记录没加md渲染！!
// 这里需要用unshift，将规则自定义到最前面，这样才能优先匹配，避免被其他规则影响！
// unshift代码的实现参考https://github.com/markdown-it/markdown-it/blob/master/lib/ruler.mjs的push函数
md.inline.ruler.unshift = md.block.ruler.unshift = function (ruleName, fn, options) {
  const opt = options || {}

  this.__rules__.unshift({
    name: ruleName,
    enabled: true,
    fn,
    alt: opt.alt || []
  })

  this.__cache__ = null
}
// 自定义规则处理markdown-mindmap标签
md.block.ruler.unshift('markdown_mindmap', markdownToMindMapRule, {
  alt: ['paragraph', 'reference', 'blockquote']
})
// 自定义渲染规则来处理 LaTeX 公式
md.inline.ruler.unshift('latex', function (state) {
  const { saveLatexRender } = state.env
  // 这里使用正则表达式匹配 LaTeX 公式。latexStart和latexEnd是自定义的标记，用于标记公式的开始和结束
  // 上面的情况可能正常，因为inline被截取后会被md.renderInline，最后还是会被渲染出来
  const regexArr = [
    { reg: () => /latexStartBlock(.*?)latexEndBlock/s, display: 'Block' },
    { reg: () => /latexStartInline(.*?)latexEndInline/s, display: 'Inline' }]
  for (let i = 0; i < regexArr.length; i++) {
    const regex = regexArr[i].reg()
    const display = regexArr[i].display

    let pos = state.pos;
    const str = state.src.slice(pos)
    const match = str.match(regex);

    // 是否匹配到latex公式
    if (match) {
      const latex = match[1]?.trim() || '';
      if (!latex) {
        continue
      }

      // 如果公式前面有其他内容，先渲染其他内容
      if (!str.startsWith(`latexStart${display}`)) {
        const startIndex = str.indexOf(`latexStart${display}`)
        const endIndex = str.indexOf(`latexEnd${display}`)
        const token = new state.Token('html_inline', '', 0);
        state.tokens.push(token);
        // 渲染前面的内容，然后再处理latex公式
        let preInlineText = str.slice(0, startIndex)
        // 这里是为了兼容加粗内部有latex公式，导致无法加粗的情况。例如：**xx latex公式 xx**。见：https://jira.inner.youdao.com/browse/YDXIAOPIOS-681
        // 做的处理是latex公式的前后都补充**，使得前后文本分别加粗展示
        if (preInlineText.startsWith('**') && str.endsWith('**')) {
          let suffInlineText = str.slice(endIndex + `latexEnd${display}`.length)
          state.pos += str.length;// 移动指针，保证移动后latex公式在最前面
          // 文本前后补充**,使得变成独立的两个加粗文本
          // 注意，如果是公式后面是**，则不要补充结尾的了。如** 文本文本 ${latex公式}** ,此时结尾的**不要补充了，否则结尾会有4个连续的*导致渲染异常
          const suffixMd = suffInlineText.startsWith('**') ? suffInlineText.slice(2) : suffInlineText
          token.content = md.renderInline(`${preInlineText.trim()}**`) +
            md.renderInline(`latexStart${display} ${latex} latexEnd${display}`) +
            suffixMd
        } else {
          state.pos += startIndex;// 移动指针，保证移动后latex公式在最前面
          token.content = `${md.renderInline(preInlineText)}`
        }
        return true
      }
      if (preUtils.hasLatex(latex)) {
        // 包裹 LaTeX 公式以便 MathJax 可以处理
        const token = new state.Token('html_inline', '', 0);
        token.content = preUtils.getLatex(latex);
        state.tokens.push(token);
        state.pos += match[0].length;
        return true
      } else {
        if (saveLatexRender) {
          const isBlock = display === 'Block'
          preUtils.preRenderLatex(latex, isBlock)
        }
        // 匹配到，但是没有实际的html，直接返回公式
        const token = new state.Token('html_inline', '', 0);
        token.content = match[0]
        state.tokens.push(token);
        state.pos += match[0].length;
        return true
      }
    }
  }
  // 没有匹配到公式，用默认的处理。返回false
  return false;
});


const defaultFenceRender = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, that) => {
  const token = tokens[idx]
  // 没有可用的语言，默认为markdown语言
  if (!token.info || !Prism.languages[token.info.trim()]) {
    token.info = 'markdown'
  }
  // 使用默认的渲染
  return defaultFenceRender(tokens, idx, options, env, that)
};

export default md