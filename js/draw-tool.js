class DrawingManager {
  constructor() {
    this.slides = document.querySelectorAll('.slide');
    this.canvases = new Map();
    this.currentTool = 'select'; // 'select' or 'draw'
    
    this.init();
  }

  init() {
    this.createTools();
    this.createCanvases();
    this.attachEventListeners();
    
    // Handle resizes to adjust canvas scales
    window.addEventListener('resize', () => {
      this.canvases.forEach((state) => {
        this.resizeCanvas(state.canvas, state.canvas.parentElement);
      });
    });
  }

  createTools() {
    const leftNav = document.createElement('nav');
    leftNav.classList.add('left-nav');
    document.body.appendChild(leftNav);
    
    const drawBtn = document.createElement('button');
    drawBtn.id = 'tool-draw';
    drawBtn.type = 'button';
    drawBtn.innerHTML = '🖌️';
    drawBtn.title = 'Draw (Disable orbit/pan)';
    
    const clearBtn = document.createElement('button');
    clearBtn.id = 'tool-clear';
    clearBtn.type = 'button';
    clearBtn.innerHTML = '🧹';
    clearBtn.title = 'Clear Drawing';
    
    leftNav.appendChild(drawBtn);
    leftNav.appendChild(clearBtn);
    
    drawBtn.addEventListener('click', () => this.toggleDrawTool(drawBtn));
    clearBtn.addEventListener('click', () => this.clearCurrentSlide());
  }

  createCanvases() {
    this.slides.forEach((slide) => {
      const canvas = document.createElement('canvas');
      canvas.classList.add('slide-canvas');
      
      this.resizeCanvas(canvas, slide);
      
      // Make it sit on top of the slide but beneath any z-index controls if needed
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none'; // Default to not intercepting clicks
      canvas.style.zIndex = '4'; // High enough to draw over the slide contents, but below the fixed header(5) and nav(6)
      
      // Ensure the slide handles absolute children correctly
      slide.style.position = 'relative'; 
      
      slide.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#a62e96'; // Purple color for drawing
      
      this.canvases.set(slide, {
        canvas,
        ctx,
        isDrawing: false,
        lastX: 0,
        lastY: 0
      });
      
      this.addCanvasEvents(slide, canvas);
    });
  }

  resizeCanvas(canvas, parent) {
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    
    // Re-apply context settings after resize
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#a62e96'; 
  }

  addCanvasEvents(slide, canvas) {
    const state = this.canvases.get(slide);
    
    // We only need the context to have the proper stroke style and width set right before drawing
    // so it doesn't get lost on resize
    
    const startDrawing = (e) => {
      if (this.currentTool !== 'draw') return;
      state.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      state.lastX = e.clientX - rect.left;
      state.lastY = e.clientY - rect.top;
      
      // Ensure context is set back up correctly in case of resize resets
      state.ctx.lineWidth = 10;
      state.ctx.lineCap = 'round';
      state.ctx.lineJoin = 'round';
      state.ctx.strokeStyle = '#a62e96';
    };
    
    const draw = (e) => {
      if (!state.isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      state.ctx.beginPath();
      state.ctx.moveTo(state.lastX, state.lastY);
      state.ctx.lineTo(x, y);
      state.ctx.stroke();
      
      state.lastX = x;
      state.lastY = y;
    };
    
    const stopDrawing = () => {
      state.isDrawing = false;
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
  }

  toggleDrawTool(btn) {
    if (this.currentTool === 'select') {
      this.currentTool = 'draw';
      btn.classList.add('active-tool');
      
      // Enable pointer events on canvases so they catch the drawing
      this.canvases.forEach(state => {
        state.canvas.style.pointerEvents = 'auto';
      });
      
      // Disable Three.js orbit controls if they exist globally
      if (window.orbitControls) { // Assuming we expose them or we intercept events
        window.orbitControls.enabled = false;
      }
      
    } else {
      this.currentTool = 'select';
      btn.classList.remove('active-tool');
      
      // Disable pointer events
      this.canvases.forEach(state => {
        state.canvas.style.pointerEvents = 'none';
      });
      
      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }
    }
  }

  clearCurrentSlide() {
    // Find the slide that is currently mostly in view based on scroll position
    let activeSlide = null;
    let minDistanceToTop = Infinity;
    
    this.slides.forEach(slide => {
      const rect = slide.getBoundingClientRect();
      // Calculate how close the top of the slide is to the top of the viewport
      const distanceToTop = Math.abs(rect.top);
      
      if (distanceToTop < minDistanceToTop) {
        minDistanceToTop = distanceToTop;
        activeSlide = slide;
      }
    });

    if (activeSlide) {
      const state = this.canvases.get(activeSlide);
      state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DrawingManager();
});