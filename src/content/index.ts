const s = document.createElement('script')
s.src = chrome.runtime.getURL('web.js')
document.head.appendChild(s)

export {}
