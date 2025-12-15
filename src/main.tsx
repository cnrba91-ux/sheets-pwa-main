import ReactDOM from 'react-dom/client';
import App from './App';

const BASE_URL = import.meta.env.BASE_URL;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE_URL}sw.js`);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
