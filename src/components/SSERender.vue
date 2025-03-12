<template lang="pug">
.wrapper(@click.capture="disableScroll")
  div(style="margin: 0.2rem auto;font-weight:bold") 复制你的markdown:
  div( style="border:1px solid #ddd;padding:0.1rem;margin:0.2rem 0")
    span 在这输入md文本
    textarea(v-model="targetText" style="height:20vh;width:80vw")
  div
    button(@click="reset") 清空
    button(@click="regenerate") 重新生成
  div(style="margin: 0.2rem auto;font-weight:bold") 生成结果:
  .mind-map-wrapper.result_text(v-html="html")
  .bottom-element(ref="bottomElementRef")
</template>

<script>
export default { name: 'mdTestOnly' }
</script>

<script setup>
/* eslint-disable */
import { nextTick, ref, computed, onMounted, watch } from 'vue';
import utils from '../assets/utils'

const showText = ref('')
const bottomElementRef = ref(null)
let intervalId

// 测试流式生成以及其他情况！
const targetText = ref(`
### **物理公式测试**
\\[\\acomm{A,B} = AB + BC \\quad \\frac{\\partial}{\\partial x} \\]
  \\[
  \\abs{1} ， \\absolutevalue{6} ， \\acomm{A,B} =AB+BC ----- \\pderivative{x}
  \\]
### **自定义块级元素-思维导图**  
# 题目分析\n+ 题目要求李华给外教Jason写封邮件，\\[ a\\divisionsymbol \\divsymbol \\div\\]针对其通过课上看电影提升学生口语的方法提出看法。要说明此方法存在的问题，并给出建议。写作对象明确，重点在于清晰表达观点。\n\n# 结构梳理
\n:mps
\n# s\n
## 开头\n
+ 礼貌问候外教Jason。\n
+ 表明很愿意提供关于课上看电影提升口语方法的建议。\n\n
## 中间\n
+ 说明问题\n  + 电影语速可能太快，学生难以跟上。\n  + 电影中的词汇和句子可能太复杂，学生不好理解。\n+ 提出建议\n  + 先从简单的英语对话练习开始。\n  + 多进行角色扮演活动。\n\n## 结尾\n+ 感谢外教的询问。\n+ 期待新方法能有效提升口语。\n\nmpe\n\n# 高分表达\n+ **开头问候**：Dear Jason,  How are you?  （亲爱的Jason，你好吗？）\n+ **表达乐意**：I'm very glad to give my suggestions. （我非常乐意给出我的建议。）\n+ **结尾感谢**：Thank you for asking for my advice.  （感谢您询问我的建议。） 

## **其他常见的markdown语法**
# 标题1
## 标题2
### 标题3
#### 标题4
##### 标题5
###### 标题6

---

## 文本格式
*这是斜体文本*  
_这也是斜体文本_  

**这是加粗文本**  
__这也是加粗文本__  

***这是加粗且斜体的文本***  
___这也是加粗且斜体的文本___  

\`这是代码文本\`  

~~这是删除线文本~~  

---

## 列表
### 无序列表
- 项目1
- 项目2
- 项目3

或者

* 项目1
* 项目2
* 项目3

或者

+ 项目1
+ 项目2
+ 项目3

### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 嵌套列表
1. 第一项
   - 子项目1
   - 子项目2
2. 第二项
   - 子项目3
   - 子项目4

---

## 链接
[链接名称](http://example.com)  
[链接名称](http://example.com "链接标题")  

---

## 引用
> 这是一段引用文本。  
> 它可以包含多行内容。

---

## 表格
| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |

---

## 分割线
---

或者

***

或者

____

---

## HTML元素
你可以直接插入HTML元素，例如：<span style="color:red;">红色文本</span>。

`)
const html = computed(() => {
  let html = utils.transformMarkdown(showText.value, {
    saveLatexRender: true,
    appendCursor: true,
    allowEmpty: true,
    //内容为空时，如果点重试，光标不会展示，因为html内容一样。因此在光标中加个时间戳，此时html就会有变化了
    timestampInCursor: true
  })
  // 滚动到底部
  scrollIntoView()
  return html
})

const disableScroll = () => window.disableAutoScroll = true

function scrollIntoView() {
  if (window.disableAutoScroll) {
    return
  }
  nextTick(() => {
    if (bottomElementRef.value) {
      bottomElementRef.value.scrollIntoView({
        behavior: 'smooth',
      })
    }
  })
}

// 模拟sse输出
function startInterval() {
  if (showText.value === targetText.value) {
    clearInterval(intervalId)
    return
  }
  // 当前文本和最终文本不同
  if (!intervalId) {
    intervalId = setInterval(() => {
      let length = showText.value.length;
      // 此时这里的定时器会导致页面卡顿，因此增加读取量，使得可以一次读更多，减少卡顿
      showText.value += targetText.value.slice(length, length + 3);
      if (showText.value.length >= targetText.value.length) {
        clearInterval(intervalId);
        intervalId = ''
        utils.removeSseCursor(true)
      }
    }, 50)
  }
}
startInterval()
const reset = () => {
  showText.value = ''
  targetText.value = ''
}
const regenerate = () => {
  window.disableAutoScroll = false
  showText.value = ''
  startInterval()
}
</script>
<style lang="stylus" scoped>
.mind-map-wrapper
  padding 0.1rem 0.2rem
  color var(--Color_text_pop)
  font-size 0.14rem
  :deep()
    h1
      font-size 0.2rem
    h2
      font-size 0.18rem
    h3
      font-size 0.16rem
    h4
      font-size 0.14rem
    /* 基本表格样式 */
    table 
      width: 100%; /* 表格宽度占满父容器 */
      border-collapse: collapse; /* 合并边框 */
      margin: 0;
      padding: 0;
      color var(--color_text_0)

    /* 表格的边框 */
    table, th, td 
      border: 1px solid #ddd; /* 边框颜色为浅灰色 */
    

    /* 表头样式 */
    th 
      background-color: var(--color_label_2); /* 表头背景为灰色 */
      font-weight: bold; /* 表头文字加粗 */
      padding: 0.12rem; /* 表头内边距 */
      text-align: left; /* 表头文字左对齐 */
    
    /* 表格单元格样式 */
    td 
      padding: 0.12rem; /* 单元格内边距 */
      text-align: left; /* 单元格文字左对齐 */
    blockquote
      margin 0 0 0.2rem 0
      padding 0 0 0 0.1rem
      border-left 5px solid #dfe2e5
  
</style>