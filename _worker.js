const CONTENT_TYPE_MAP = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'webm': 'video/webm'
};

const CACHE_CONFIG = {
  HTML: 3600,
  IMAGE: 86400,
  API: 300
};

function extractConfig(env) {
  return {
    domain: env.DOMAIN,
    database: env.DATABASE,
    username: env.USERNAME,
    password: env.PASSWORD,
    adminPath: env.ADMIN_PATH,
    enableAuth: env.ENABLE_AUTH === 'true',
    tgBotToken: env.TG_BOT_TOKEN,
    tgChatId: env.TG_CHAT_ID,
    maxSize: (env.MAX_SIZE_MB ? parseInt(env.MAX_SIZE_MB, 10) : 20) * 1024 * 1024
  };
}

function createCachedResponse(body, contentType, cacheMaxAge) {
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${cacheMaxAge}`,
      'CDN-Cache-Control': `public, max-age=${cacheMaxAge}`
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function unauthorizedResponse() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
  });
}

function getFileExtension(url) {
  return url.split('.').pop().toLowerCase();
}

function getContentType(extension) {
  return CONTENT_TYPE_MAP[extension] || 'application/octet-stream';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const config = extractConfig(env);
    switch (pathname) {
      case '/':
        return await handleRootRequest(request, config);
      case `/${config.adminPath}`:
        return await handleAdminRequest(request, config);
      case '/upload':
        return request.method === 'POST'
          ? await handleUploadRequest(request, config)
          : new Response('Method Not Allowed', { status: 405 });
      case '/bing-images':
        return handleBingImagesRequest();
      case '/delete-images':
        return await handleDeleteImagesRequest(request, config);
      default:
        return await handleImageRequest(request, config);
    }
  }
};

function authenticate(request, username, password) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials).split(':');
    return credentials[0] === username && credentials[1] === password;
  } catch {
    return false;
  }
}

async function handleRootRequest(request, config) {
  const cache = caches.default;
  const cacheKey = new Request(request.url);
  if (config.enableAuth && !authenticate(request, config.username, config.password)) {
    return unauthorizedResponse();
  }
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  const response = createCachedResponse(`
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="随意文件床-基于Workers的图床/文件床/视频床服务">
  <meta name="keywords" content="Telegraph图床,Workers图床, telegraph文件床, telegraph视频床, Cloudflare, Workers,telegra.ph, 图床">
  <title>随意文件床-基于TG-BOT的文件床服务</title>
  <link rel="icon" href="https://p1.meituan.net/csc/c195ee91001e783f39f41ffffbbcbd484286.ico" type="image/x-icon">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.1/css/bootstrap.min.css" integrity="sha512-T584yQ/tdRR5QwOpfvDfVQUidzfgc2339Lc8uBDtcp/wYu80d7jwBgAxbyMh0a9YM[...]
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-fileinput/5.2.7/css/fileinput.min.css" integrity="sha512-qPjB0hQKYTx1Za9Xip5h0PXcxaR1cRbHuZHo9z+gb5IgM6ZOTtIH4QLITCxcCp/[...]
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.min.css" integrity="sha512-6S2HWzVFxruDlZxI3sXOZZ4/eJ8AcxkQH1+JjSe/ONCEqR9L4Ysq5JdT5ipqtzU7WHalNwzwBv+iE51g[...]
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/[...]
  <style>
      body {
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          position: relative;
      }
      .background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          z-index: -1;
          transition: opacity 1s ease-in-out;
          opacity: 1;
      }
      .card {
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: none;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 30px;
          width: 90%;
          max-width: 600px;
          text-align: center;
          margin: 0 auto;
          position: relative;
      }
      .title {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
      }
      .uniform-height {
          margin-top: 20px;
      }
      #viewCacheBtn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: rgba(102, 126, 234, 0.5);
          cursor: pointer;
          font-size: 22px;
          transition: all 0.3s ease;
      }
      #viewCacheBtn:hover {
          color: #667eea;
          transform: scale(1.1);
      }
      #compressionToggleBtn {
          position: absolute;
          top: 15px;
          right: 55px;
          background: none;
          border: none;
          color: rgba(102, 126, 234, 0.5);
          cursor: pointer;
          font-size: 22px;
          transition: all 0.3s ease;
      }
      #compressionToggleBtn:hover {
          color: #667eea;
          transform: scale(1.1);
      }
      #cacheContent {
          margin-top: 20px;
          max-height: 250px;
          border-radius: 8px;
          overflow-y: auto;
      }
      .cache-title {
          text-align: left;
          margin-bottom: 10px;
      }
      .cache-item {
          display: block;
          cursor: pointer;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          text-align: left;
          padding: 12px 15px;
          margin-bottom: 8px;
          background: white;
          border: 1px solid rgba(102, 126, 234, 0.1);
      }
      .cache-item:hover {
          background-color: rgba(102, 126, 234, 0.05);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateX(5px);
      }
      .upload-hint {
          color: #999;
          font-size: 14px;
          margin-top: 15px;
          line-height: 1.6;
      }
      .upload-hint i {
          color: #667eea;
          margin-right: 5px;
      }
      .project-link {
          font-size: 14px;
          text-align: center;
          margin-top: 15px;
          margin-bottom: 0;
          color: #999;
          line-height: 1.6;
      }
      .project-link a {
          color: #667eea;
          text-decoration: none;
          transition: color 0.3s ease;
      }
      .project-link a:hover {
          color: #764ba2;
          text-decoration: underline;
      }
      textarea.form-control {
          max-height: 200px;
          overflow-y: hidden;
          resize: none;
      }
      .upload-progress {
          display: none;
          margin-top: 15px;
          text-align: center;
      }
      .progress-text {
          font-size: 14px;
          font-weight: 500;
          color: #667eea;
          letter-spacing: 0.5px;
      }
      .thumbnail-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
          justify-content: center;
      }
      .thumbnail-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
      }
      .thumbnail-item:hover {
          transform: scale(1.05);
      }
      .thumbnail-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }
      .thumbnail-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
      }
      .thumbnail-item .file-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 24px;
      }
      .thumbnail-item .remove-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
      }
      .thumbnail-item:hover .remove-btn {
          opacity: 1;
      }
      .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: none !important;
          color: white !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
      }
      .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
      }
      .btn-primary:active, .btn-primary:focus {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
      }
      .file-drop-zone {
          border: 2px dashed #667eea !important;
          border-radius: 12px !important;
          background: rgba(102, 126, 234, 0.05) !important;
          transition: all 0.3s ease !important;
      }
      .file-drop-zone:hover {
          border-color: #764ba2 !important;
          background: rgba(102, 126, 234, 0.1) !important;
      }
      .file-drop-zone-title {
          color: #667eea !important;
          font-weight: 500 !important;
      }
      .btn-danger, .fileinput-remove {
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
      }
      .btn-danger:hover, .fileinput-remove:hover {
          transform: translateY(-2px);
      }
      .btn-danger:active, .fileinput-remove:active {
          transform: translateY(0);
      }
      .btn-light {
          border-radius: 8px !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
      }
      .btn-light:hover {
          transform: translateY(-2px);
      }
      .btn-light:active {
          transform: translateY(0);
      }
      @media (max-width: 768px) {
          .card {
              width: 95%;
              max-width: 100%;
              padding: 20px;
              border-radius: 12px;
          }
          .title {
              font-size: 24px;
          }
          #viewCacheBtn, #compressionToggleBtn {
              font-size: 20px;
          }
          .btn-primary, .btn-danger, .btn-light {
              min-height: 44px;
              min-width: 44px;
          }
          .cache-item {
              padding: 15px;
          }
      }
  </style>
</head>
<body>
  <div class="background" id="background"></div>
  <div class="card">
      <div class="title">随意文件床</div>
      <button type="button" class="btn" id="viewCacheBtn" title="查看历史记录"><i class="fas fa-clock"></i></button>
      <button type="button" class="btn" id="compressionToggleBtn"><i class="fas fa-compress"></i></button>
      <div class="card-body">
          <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
              <div class="file-input-container">
                  <input id="fileInput" name="file" type="file" class="form-control-file" data-browse-on-zone-click="true" multiple>
              </div>
              <div class="upload-hint">
                  <i class="fas fa-info-circle"></i>支持拖拽上传 · 多文件上传 · Ctrl+V 粘贴上传
              </div>
              <div class="form-group mb-3 uniform-height" style="display: none;">
                  <button type="button" class="btn btn-light mr-2" id="urlBtn">URL</button>
                  <button type="button" class="btn btn-light mr-2" id="bbcodeBtn">BBCode</button>
                  <button type="button" class="btn btn-light" id="markdownBtn">Markdown</button>
              </div>
              <div class="form-group mb-3 uniform-height" style="display: none;">
                  <textarea class="form-control" id="fileLink" readonly></textarea>
              </div>
              <div class="upload-progress" id="uploadProgress">
                  <div class="progress-text" id="progressText">上传中... 0%</div>
              </div>
              <div class="thumbnail-container" id="thumbnailContainer"></div>
              <div id="cacheContent" style="display: none;"></div>
          </form>
      </div>
      <p style="font-size: 16px; text-align: center;">
          支持一切文件格式，包括且不限于图片，视频，文档等
        </p>
        <p style="font-size: 14px; text-align: center;">
          可多选文件上传，文件大小需 ≤ 30MB 
        </p>
        <p style="font-size: 18px; color:green;text-align: center;">
          长期 | 安全 | 稳定 | 免费
      </p>
      <p id="uptimeDays" style="font-size:16px; text-align:center; color:#333; margin-top:8px;">
        <!-- 文本由脚本填充 -->
      </p>
      <p>
      <p class="project-link">项目开源于 GitHub - <a href="https://github.com/0-RTT/telegraph" target="_blank" rel="noopener noreferrer">0-RTT/telegraph</a></p>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" integrity="sha512-894YE6QWD5I59HgZOGReFYm4dnWc1Qt5NtvYSaNcOP+u1T9qYdvdihz0PPSiiqn/+/3e7Jo4EaG7TubfWGUrMQ==" crosso[...]
      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-fileinput/5.2.7/js/fileinput.min.js" integrity="sha512-CCLv901EuJXf3k0OrE5qix8s2HaCDpjeBERR2wVHUwzEIc7jfiK9wqJFssyMOc1lJ/KvYKsDenzxb[...]
      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-fileinput/5.2.7/js/locales/zh.min.js" integrity="sha512-IizKWmZY3aznnbFx/Gj8ybkRyKk7wm+d7MKmEgOMRQDN1D1wmnDRupfXn6X04pwIyKFWsmFVgrcl[...]
      <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.min.js" integrity="sha512-lbwH47l/tPXJYG9AcFNoJaTMhGvYWhVM9YI43CT+uteTRRaiLCui8snIgyAN8XWgNjNhCqlAUdzZptso6OCoFQ==" cro[...]
      <script>
      function formatLinks(urls, format) {
        switch (format) {
          case 'url':
            return urls.join('\\n\\n');
          case 'bbcode':
            return urls.map(url => '[img]' + url + '[/img]').join('\\n\\n');
          case 'markdown':
            return urls.map(url => '![image](' + url + ')').join('\\n\\n');
          default:
            return urls.join('\\n');
        }
      }

      async function fetchBingImages() {
        try {
          const response = await fetch('/bing-images');
          if (!response.ok) {
            throw new Error('获取背景图片失败: HTTP ' + response.status);
          }
          const data = await response.json();
          return data.data?.map(image => image.url) || [];
        } catch (error) {
          console.error('获取Bing背景图片失败:', error);
          return [];
        }
      }

      async function setBackgroundImages() {
        const images = await fetchBingImages();
        if (images.length === 0) return;
        const bg1 = document.getElementById('background');
        const bg2 = document.createElement('div');
        bg2.className = 'background';
        bg2.style.opacity = 0;
        document.body.insertBefore(bg2, bg1.nextSibling);
        let index = 0;
        let currentBg = bg1;
        let nextBg = bg2;
        bg1.style.backgroundImage = 'url(' + images[0] + ')';
        setInterval(() => {
          index = (index + 1) % images.length;
          nextBg.style.backgroundImage = 'url(' + images[index] + ')';
          nextBg.style.opacity = 0;
          setTimeout(() => {
            nextBg.style.opacity = 1;
            currentBg.style.opacity = 0;
          }, 50);
          setTimeout(() => {
            const temp = currentBg;
            currentBg = nextBg;
            nextBg = temp;
          }, 1000);
        }, 5000);
      }
    
      $(document).ready(function() {
        let originalImageURLs = [];
        let thumbnailData = [];
        let isCacheVisible = false;
        let enableCompression = true;
        initFileInput();
        setBackgroundImages();
    
        const tooltipText = enableCompression ? '关闭压缩' : '开启压缩';
        $('#compressionToggleBtn').attr('title', tooltipText);
        $('#compressionToggleBtn').on('click', function() {
            enableCompression = !enableCompression;
            const icon = $(this).find('i');
            icon.toggleClass('fa-compress fa-expand');
            const tooltipText = enableCompression ? '关闭压缩' : '开启压缩';
            $(this).attr('title', tooltipText);
        });
    
        function initFileInput() {
          $("#fileInput").fileinput({
            theme: 'fa',
            language: 'zh',
            browseClass: "btn btn-primary",
            removeClass: "btn btn-danger",
            showUpload: false,
            showPreview: false,
          }).on('filebatchselected', handleFileSelection)
            .on('fileclear', handleFileClear);
        }
    
        async function handleFileSelection() {
          const files = $('#fileInput')[0].files;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileHash = await calculateFileHash(file);
            const cachedData = getCachedData(fileHash);
            if (cachedData) {
                handleCachedFile(cachedData);
            } else {
                await uploadFile(file, fileHash);
            }
          }
        }
    
        function getCachedData(fileHash) {
            const cacheData = JSON.parse(localStorage.getItem('uploadCache')) || [];
            return cacheData.find(item => item.hash === fileHash);
        }
    
        function handleCachedFile(cachedData) {
            if (!originalImageURLs.includes(cachedData.url)) {
                originalImageURLs.push(cachedData.url);
                updateFileLinkDisplay();
                toastr.info('已从缓存中读取数据');
            }
        }
    
        function updateFileLinkDisplay() {
            $('#fileLink').val(originalImageURLs.join('\\n\\n'));
            $('.form-group').show();
            adjustTextareaHeight($('#fileLink')[0]);
        }

        function addThumbnail(file, url) {
            const container = $('#thumbnailContainer');
            const index = thumbnailData.length;
            const previewUrl = URL.createObjectURL(file);
            thumbnailData.push({ previewUrl, url, file });

            let thumbnailContent = '';
            if (file.type.startsWith('image/')) {
                thumbnailContent = '<img src="' + previewUrl + '" alt="thumbnail">';
            } else if (file.type.startsWith('video/')) {
                thumbnailContent = '<video src="' + previewUrl + '" muted></video>';
            } else {
                const ext = file.name.split('.').pop().toUpperCase();
                thumbnailContent = '<div class="file-icon">' + ext + '</div>';
            }

            const thumbnailHtml = '<div class="thumbnail-item" data-index="' + index + '">' +
                thumbnailContent +
                '<button class="remove-btn" title="移除">&times;</button>' +
            '</div>';

            container.append(thumbnailHtml);
        }

        function removeThumbnail(index) {
            const item = thumbnailData[index];
            if (item && item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
            thumbnailData[index] = null;

            const urlToRemove = item ? item.url : null;
            if (urlToRemove) {
                originalImageURLs = originalImageURLs.filter(u => u !== urlToRemove);
                updateFileLinkDisplay();
                if (originalImageURLs.length === 0) {
                    hideButtonsAndTextarea();
                }
            }

            $('.thumbnail-item[data-index="' + index + '"]').remove();
        }

        function clearAllThumbnails() {
            thumbnailData.forEach(item => {
                if (item && item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
            thumbnailData = [];
            $('#thumbnailContainer').empty();
        }

        $(document).on('click', '.thumbnail-item .remove-btn', function(e) {
            e.stopPropagation();
            const index = $(this).parent().data('index');
            removeThumbnail(index);
        });

        async function calculateFileHash(file) {
          const chunkSize = 1024 * 1024;
          const chunk = file.size > chunkSize ? file.slice(0, chunkSize) : file;
          const arrayBuffer = await chunk.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
          return hash + '-' + file.size + '-' + file.lastModified;
        }
    
        function isFileInCache(fileHash) {
          const cacheData = JSON.parse(localStorage.getItem('uploadCache')) || [];
          return cacheData.some(item => item.hash === fileHash);
        }
    
        async function uploadFile(file, fileHash) {
          const originalFile = file;
          try {
            const interfaceInfo = {
              enableCompression: enableCompression
            };
            if (file.type.startsWith('image/') && file.type !== 'image/gif' && interfaceInfo.enableCompression) {
              toastr.info('正在压缩...', '', { timeOut: 0 });
              const compressedFile = await compressImage(file);
              file = compressedFile;
              toastr.clear();
            }
            const formData = new FormData();
            formData.append('file', file, file.name);
            $('#uploadProgress').show();
            $('#progressText').text('上传中... 0%');
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                $('#progressText').text('上传中... ' + percentComplete + '%');
              }
            });

            const uploadPromise = new Promise((resolve, reject) => {
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    resolve(JSON.parse(xhr.responseText));
                  } catch (e) {
                    reject(new Error('响应解析失败'));
                  }
                } else {
                  try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.error || '上传失败'));
                  } catch (e) {
                    reject(new Error('上传失败: HTTP ' + xhr.status));
                  }
                }
              };
              xhr.onerror = () => reject(new Error('网络错误，请检查网络连接'));
              xhr.ontimeout = () => reject(new Error('上传超时，请重试'));
              xhr.open('POST', '/upload');
              xhr.timeout = 120000;
              xhr.send(formData);
            });

            const responseData = await uploadPromise;
            $('#uploadProgress').hide();
            if (responseData.error) {
              toastr.error(responseData.error);
            } else {
              originalImageURLs.push(responseData.data);
              addThumbnail(originalFile, responseData.data);
              $('#fileLink').val(originalImageURLs.join('\\n\\n'));
              $('.form-group').show();
              adjustTextareaHeight($('#fileLink')[0]);
              toastr.success('上传成功! 点击下方按钮复制链接', '', {
                timeOut: 3000,
                progressBar: true
              });
              saveToLocalCache(responseData.data, file.name, fileHash);
            }
          } catch (error) {
            console.error('处理文件时出现错误:', error);
            $('#uploadProgress').hide();
            let errorMsg = '文件处理失败';
            if (error.message.includes('网络')) {
              errorMsg = '网络错误，请检查网络连接';
            } else if (error.message.includes('超时')) {
              errorMsg = '上传超时，请重试';
            } else if (error.message) {
              errorMsg = error.message;
            }
            toastr.error(errorMsg);
          } finally {
            toastr.clear();
          }
        }

        $(document).on('paste', async function(event) {
          const clipboardData = event.originalEvent.clipboardData;
          if (clipboardData && clipboardData.items) {
            for (let i = 0; i < clipboardData.items.length; i++) {
              const item = clipboardData.items[i];
              if (item.kind === 'file') {
                const pasteFile = item.getAsFile();
                const dataTransfer = new DataTransfer();
                const existingFiles = $('#fileInput')[0].files;
                for (let j = 0; j < existingFiles.length; j++) {
                  dataTransfer.items.add(existingFiles[j]);
                }
                dataTransfer.items.add(pasteFile);
                $('#fileInput')[0].files = dataTransfer.files;
                $('#fileInput').trigger('change');
                break;
              }
            }
          }
        });

        const $card = $('.card');
        $card.on('dragover', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $(this).css('background-color', 'rgba(255, 255, 255, 0.95)');
        });

        $card.on('dragleave', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $(this).css('background-color', 'rgba(255, 255, 255, 0.8)');
        });

        $card.on('drop', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $(this).css('background-color', 'rgba(255, 255, 255, 0.8)');
          const files = e.originalEvent.dataTransfer.files;
          if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            for (let i = 0; i < files.length; i++) {
              dataTransfer.items.add(files[i]);
            }
            $('#fileInput')[0].files = dataTransfer.files;
            $('#fileInput').trigger('change');
          }
        });
    
        async function compressImage(file, quality = 0.75) {
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
              const targetWidth = image.width;
              const targetHeight = image.height;
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
              canvas.toBlob((blob) => {
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                toastr.success('图片压缩成功！');
                resolve(compressedFile);
              }, 'image/jpeg', quality);
            };
            const reader = new FileReader();
            reader.onload = (event) => {
              image.src = event.target.result;
            };
            reader.readAsDataURL(file);
          });
        }
    
        $('#urlBtn, #bbcodeBtn, #markdownBtn').on('click', function() {
          const fileLinks = originalImageURLs.map(url => url.trim()).filter(url => url !== '');
          if (fileLinks.length > 0) {
            const formatMap = {
              'urlBtn': 'url',
              'bbcodeBtn': 'bbcode',
              'markdownBtn': 'markdown'
            };
            const format = formatMap[$(this).attr('id')];
            const formattedLinks = formatLinks(fileLinks, format);
            $('#fileLink').val(formattedLinks);
            adjustTextareaHeight($('#fileLink')[0]);
            copyToClipboardWithToastr(formattedLinks);
          }
        });
    
        function handleFileClear(event) {
          $('#fileLink').val('');
          adjustTextareaHeight($('#fileLink')[0]);
          hideButtonsAndTextarea();
          originalImageURLs = [];
          clearAllThumbnails();
        }
    
        function adjustTextareaHeight(textarea) {
          textarea.style.height = '1px';
          textarea.style.height = (textarea.scrollHeight > 200 ? 200 : textarea.scrollHeight) + 'px';
    
          if (textarea.scrollHeight > 200) {
            textarea.style.overflowY = 'auto';
          } else {
            textarea.style.overflowY = 'hidden';
          }
        }
    
        function copyToClipboardWithToastr(text) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              toastr.success('已复制到剪贴板', '', { timeOut: 300 });
            }).catch(() => {
              toastr.error('复制失败');
            });
          } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand('copy');
              toastr.success('已复制到剪贴板', '', { timeOut: 300 });
            } catch (err) {
              toastr.error('复制失败');
            }
            document.body.removeChild(textarea);
          }
        }
    
        function hideButtonsAndTextarea() {
          $('#urlBtn, #bbcodeBtn, #markdownBtn, #fileLink').parent('.form-group').hide();
        }
    
        function saveToLocalCache(url, fileName, fileHash) {
          const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
          const cacheData = JSON.parse(localStorage.getItem('uploadCache')) || [];
          cacheData.push({ url, fileName, hash: fileHash, timestamp });
          localStorage.setItem('uploadCache', JSON.stringify(cacheData));
        }
    
        $('#viewCacheBtn').on('click', function() {
          const cacheData = JSON.parse(localStorage.getItem('uploadCache')) || [];
          const cacheContent = $('#cacheContent');
          cacheContent.empty();
          if (isCacheVisible) {
            cacheContent.hide();
            $('#fileLink').val('');
            $('#fileLink').parent('.form-group').hide();
            isCacheVisible = false;
          } else {
            if (cacheData.length > 0) {
              const html = cacheData.reverse().map((item) =>
                '<div class="cache-item" data-url="' + item.url + '">' +
                item.timestamp + ' - ' + item.fileName +
                '</div><br>'
              ).join('');
              cacheContent.html(html).show();
            } else {
              cacheContent.html('<div>还没有记录哦！</div>').show();
            }
            isCacheVisible = true;
          }
        });
    
        $(document).on('click', '.cache-item', function() {
          const url = $(this).data('url');
          originalImageURLs = [];
          $('#fileLink').val('');
          originalImageURLs.push(url);
          $('#fileLink').val(originalImageURLs.map(url => url.trim()).join('\\n\\n'));
          $('.form-group').show();
          adjustTextareaHeight($('#fileLink')[0]);
        });

        // 计算并显示运行天数，从 2025-01-01 开始
        function updateUptimeDays() {
          try {
            const start = new Date(2025, 0, 1); // 2025-01-01 (month 0 = January)
            const now = new Date();

            // 只比较年月日以避免时区/时分秒差异产生 ±1 天误差
            const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
            const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());

            const msPerDay = 24 * 60 * 60 * 1000;
            let days = Math.floor((utcNow - utcStart) / msPerDay);

            // 如果希望把起始日（2025-01-01）也算作第 1 天，可以启用下面一行：
            // days = days + 1;

            if (days < 0) days = 0;

            const el = document.getElementById('uptimeDays');
            if (el) {
              el.textContent = `截止今天，本网站已持续运营${days}天`;
            }
          } catch (e) {
            console.error('updateUptimeDays error', e);
          }
        }

        // 初始执行并设置周期更新（每小时），确保跨日也会自动刷新
        updateUptimeDays();
        setInterval(updateUptimeDays, 60 * 60 * 1000);

      });
    </script>    
</body>
</html>
`, 'text/html;charset=UTF-8', CACHE_CONFIG.HTML);
  await cache.put(cacheKey, response.clone());
  return response;
}

async function handleAdminRequest(request, config) {
  if (!authenticate(request, config.username, config.password)) {
    return unauthorizedResponse();
  }
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  return await generateAdminPage(config.database, page);
}

async function generateAdminPage(DATABASE, page = 1) {
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const totalCount = await DATABASE.prepare('SELECT COUNT(*) as count FROM media').first();
  const totalPages = Math.ceil(totalCount.count / pageSize);
  const mediaData = await fetchMediaData(DATABASE, pageSize, offset);
  const mediaHtml = mediaData.map(({ url }) => {
    const fileExtension = url.split('.').pop().toLowerCase();
    const timestamp = url.split('/').pop().split('.')[0];
    const mediaType = escapeHtml(fileExtension);
    const escapedUrl = escapeHtml(url);
    const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'];
    const supportedVideoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    const isSupported = [...supportedImageExtensions, ...supportedVideoExtensions].includes(fileExtension);
    const backgroundStyle = isSupported ? '' : `style="font-size: 50px; display: flex; justify-content: center; align-items: center;"`;
    const icon = isSupported ? '' : '📁';
    return `
    <div class="media-container" data-key="${escapedUrl}" onclick="toggleImageSelection(this)" ${backgroundStyle}>
      <div class="skeleton"></div>
      <div class="media-type">${mediaType}</div>
      ${supportedVideoExtensions.includes(fileExtension) ? `
        <video class="gallery-video" preload="none" controls>
          <source data-src="${escapedUrl}" type="video/${escapeHtml(fileExtension)}">
          您的浏览器不支持视频标签。
        </video>
      ` : `
        ${isSupported ? `<img class="gallery-image lazy" data-src="${escapedUrl}" alt="Image">` : icon}
      `}
      <div class="upload-time">上传时间: ${escapeHtml(new Date(parseInt(timestamp)).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))}</div>
    </div>
    `;
  }).join('');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>图库</title>
    <link rel="icon" href="https://p1.meituan.net/csc/c195ee91001e783f39f41ffffbbcbd484286.ico" type="image/x-icon">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .page-title {
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
        margin-bottom: 20px;
        letter-spacing: 0.5px;
      }
      .header {
        position: sticky;
        top: 10px;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px 20px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.6);
        flex-wrap: wrap;
      }
      .header-left {
        flex: 1;
        display: flex;
        gap: 15px;
        align-items: center;
        color: #555;
        font-weight: 500;
      }
      .header-right {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        flex: 1;
        flex-wrap: wrap;
      }
      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
      .media-container {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.6);
        aspect-ratio: 1 / 1;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .media-container:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        border-color: rgba(102, 126, 234, 0.3);
      }
      .media-container.selected {
        border: 2px solid #667eea;
        background: rgba(102, 126, 234, 0.1);
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
      }
      .media-type {
        position: absolute;
        top: 10px;
        left: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .upload-time {
        position: absolute;
        bottom: 10px;
        left: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        padding: 8px 10px;
        border-radius: 8px;
        color: #555;
        font-size: 12px;
        z-index: 10;
        display: none;
      }
      .gallery-image, .gallery-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: opacity 0.4s ease;
        opacity: 0;
      }
      .gallery-image.loaded, .gallery-video.loaded {
        opacity: 1;
      }
      .skeleton {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 16px;
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .skeleton.hidden {
        display: none;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 16px;
        color: #999;
        padding: 20px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        backdrop-filter: blur(8px);
      }
      .delete-button, .copy-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 10px 20px;
