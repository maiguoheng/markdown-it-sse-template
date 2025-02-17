import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 公式渲染
const rendMath = (mathEle, callback) => {
  const mathContent = mathEle || document.body;
  if (window.MathJax?.typesetPromise) {
    // 使用MathJax.typesetPromise进行异步渲染
    window.MathJax.typesetPromise([mathContent]).then(() => {
      // 类型设置完成后，执行回调函数
      if (callback) {
        callback();
      }
    }).catch((error) => {
      console.error('MathJax typesetting failed:', error);
    });
  }
}

// 公式加载及渲染，默认渲染聊天区域
const loadMathJax = (ele, callback) => {
  let mathEle
  if (ele) {
    mathEle = ele
  } else {
    mathEle = document.querySelector('.result-area')
  }
  if (window.MathJax) {
    if (!callback) {
      rendMath(mathEle, () => {
      })
    } else {
      rendMath(mathEle, () => {
        callback()
      })
    }
  }
}

window.loadMathJax = loadMathJax// loadMathJaxThrottle



createApp(App).mount('#app')
