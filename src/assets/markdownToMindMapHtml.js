/* eslint-disable */
import markdown from 'simple-mind-map/src/parse/markdown.js'
// 将markdown转换为mindmap的html

function markdownToMindMap(markdownText) {
  const tree = markdown.transformMarkdownTo(markdownText)
  if (!tree) return ''

  function markNodeDeep(node, deep) {
    node.data.deep = deep
    if (!node.children) return
    node.children.forEach(child => {
      markNodeDeep(child, deep + 1)
    })
  }
  markNodeDeep(tree, 0)
  function generateVerTree(root) {
    const nodeColorClasses = ['mind-node-green', 'mind-node-orange', 'mind-node-red']
    // isLastItemInParent：用于四级节点，当他的父元素是最后一个节点时，不显示向下的连接线
    // level1Index:对应的二级节点位置不用，该节点下的整体颜色不同
    function getNodeHtml(node, isLastItemInParent, level1Index) {
      // 根据ui图，第一个节点不展示。直接渲染子节点
      if (node.data.deep === 0) {
        return node.children?.map((ele, idx) => getNodeHtml(ele, idx === node.children.length - 1, idx)).join('')
      }
      const colorClass = nodeColorClasses[level1Index % nodeColorClasses.length]
      // 二级节点 ，即实际图中的一级节点，简单渲染即可
      if (node.data.deep === 1) {
        const hasChild = node.children?.length
        // 
        return `
        <div class="mindmap-base-node level-1 ${colorClass} ${hasChild ? 'has-child' : ''}">
        ${node.data.text}
        </div>
        ${hasChild ?
            `<div style="margin-bottom:0.32rem">${node.children?.map((ele, idx) => getNodeHtml(ele, idx === node.children.length - 1, level1Index)).join('')}</div>` : ''
          }
      `

      }
      // 三级节点 ，即实际图中的二级节点，分有无二级节点的情况
      if (node.data.deep === 2) {
        // 有三级别节点
        if (node.children.length) {
          // level-2 has-child-wrapper的div是为了生成向下的连接线
          return `
      <div class="mind-node-wrapper">
        <div class="level-2 has-child-wrapper ${!isLastItemInParent && 'show-bottom-line'} ${colorClass}">
          <div class="mindmap-base-node level-2 has-child ${colorClass}">${node.data.text}</div>
          </div>
        <div class="level-3" style="flex:1">
          ${node.children?.map(((ele, idx) => getNodeHtml(ele, idx === node.children.length - 1, level1Index))).join('')}
        </div>
      </div>`
        }
        // 无三级节点
        if (!node.children.length) {
          return `<div class="mindmap-base-node level-2 no-child ${colorClass} ${!isLastItemInParent ? 'show-bottom-line':''}">${node.data.text}</div>`
        }

      }
      // 三级节点，最多
      if (node.data.deep === 3) {
        return `<div class="mindmap-base-node level-3 ${colorClass}">${node.data.text}</div>`
      }

    }
    return getNodeHtml(root, false, 666)
  }
  return generateVerTree(tree)
}
export default markdownToMindMap