// Baukasten System - Portfolio Website Builder
class PortfolioBaukasten {
    constructor() {
        this.components = new Map();
        this.currentConfig = {
            colors: {
                primary: '#3b82f6',
                accent: '#8b5cf6'
            },
            darkMode: true,
            components: []
        };
        this.draggedElement = null;
        this.currentEditingComponent = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupDragAndDrop();
        this.updateCSSVariables();
        this.setupEditableElements();
    }

    setupEventListeners() {
        // Editor Toggle
        document.getElementById('toggle-editor')?.addEventListener('click', this.toggleEditor.bind(this));
        
        // Component Buttons
        document.querySelectorAll('.add-component').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.addComponent(type);
            });
        });

        // Design Controls
        document.getElementById('primary-color')?.addEventListener('change', (e) => {
            this.currentConfig.colors.primary = e.target.value;
            this.updateCSSVariables();
        });

        document.getElementById('accent-color')?.addEventListener('change', (e) => {
            this.currentConfig.colors.accent = e.target.value;
            this.updateCSSVariables();
        });

        document.getElementById('dark-mode')?.addEventListener('change', (e) => {
            this.currentConfig.darkMode = e.target.checked;
            this.toggleDarkMode(e.target.checked);
        });

        // File Operations
        document.getElementById('export-config')?.addEventListener('click', this.exportConfig.bind(this));
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-config')?.click();
        });
        document.getElementById('import-config')?.addEventListener('change', this.importConfig.bind(this));
        document.getElementById('generate-files')?.addEventListener('click', this.generateFiles.bind(this));

        // Modal Controls
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', this.closeModal.bind(this));
        });

        document.getElementById('save-changes')?.addEventListener('click', this.saveComponentChanges.bind(this));
        document.getElementById('cancel-edit')?.addEventListener('click', this.closeModal.bind(this));

        // Preview Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Download Files
        document.getElementById('download-files')?.addEventListener('click', this.downloadFiles.bind(this));

        // Global Click Handler for Component Controls
        document.addEventListener('click', this.handleComponentControls.bind(this));

        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    this.exportConfig();
                    break;
                case 'o':
                    e.preventDefault();
                    document.getElementById('import-config')?.click();
                    break;
                case 'e':
                    e.preventDefault();
                    this.toggleEditor();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    setupEditableElements() {
        document.querySelectorAll('.editable').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.makeElementEditable(element);
            });
        });
    }

    makeElementEditable(element) {
        if (element.contentEditable === 'true') return;
        
        element.contentEditable = true;
        element.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        const finishEditing = () => {
            element.contentEditable = false;
            element.blur();
            this.updateComponentInConfig(
                element.closest('[data-component-id]')?.getAttribute('data-component-id'),
                this.getComponentData(element.closest('.component'))
            );
        };
        
        element.addEventListener('blur', finishEditing, { once: true });
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            }
        }, { once: true });
    }

    toggleEditor() {
        const panel = document.querySelector('.baukasten-panel');
        const container = document.getElementById('website-container');
        
        if (!panel || !container) return;
        
        panel.classList.toggle('hidden');
        container.classList.toggle('full-width');
        
        const btn = document.getElementById('toggle-editor');
        if (btn) {
            btn.textContent = panel.classList.contains('hidden') ? 'Editor anzeigen' : 'Editor ausblenden';
        }
    }

    addComponent(type, targetContainer = null, data = null) {
        const template = document.querySelector(`[data-template="${type}"]`);
        if (!template) {
            console.error(`Template for ${type} not found`);
            this.showNotification(`Template für ${type} nicht gefunden!`, 'error');
            return;
        }

        const newComponent = template.cloneNode(true);
        newComponent.classList.remove('template');
        newComponent.classList.add('component', 'fade-in');
        newComponent.style.display = 'block';
        
        // Generate unique ID
        const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        newComponent.setAttribute('data-component-id', id);

        // Add to appropriate container
        if (!targetContainer) {
            targetContainer = this.getDefaultContainer(type);
        }
        
        if (targetContainer) {
            targetContainer.appendChild(newComponent);
            
            // Setup component controls
            this.setupComponentControls(newComponent);
            
            // Setup editable elements
            newComponent.querySelectorAll('.editable').forEach(element => {
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.makeElementEditable(element);
                });
            });
            
            // Populate with data if provided
            if (data) {
                this.populateComponentData(newComponent, data);
            }
            
            // Add to config
            this.addComponentToConfig(id, type, data || this.getComponentData(newComponent));
            
            // Animate in
            setTimeout(() => {
                newComponent.classList.add('visible');
            }, 100);
            
            this.showNotification(`${type} Komponente hinzugefügt!`, 'success');
            console.log(`Added ${type} component with ID: ${id}`);
        }
    }

    getDefaultContainer(type) {
        const containers = {
            'project-card': document.getElementById('projects-grid'),
            'skill-item': document.getElementById('skills-grid'),
            'tutorial-card': this.getOrCreateTutorialsGrid(),
            'social-link': this.getOrCreateSocialGrid(),
            'update-item': this.getOrCreateUpdatesGrid(),
            'knowledge-category': this.getOrCreateKnowledgeGrid()
        };
        
        return containers[type];
    }

    getOrCreateTutorialsGrid() {
        let grid = document.querySelector('.tutorials-grid');
        if (!grid) {
            grid = this.createTutorialsSection();
        }
        return grid;
    }

    getOrCreateSocialGrid() {
        let grid = document.querySelector('.social-links-grid');
        if (!grid) {
            grid = this.createSocialSection();
        }
        return grid;
    }

    getOrCreateUpdatesGrid() {
        let grid = document.querySelector('.updates-grid');
        if (!grid) {
            grid = this.createUpdatesSection();
        }
        return grid;
    }

    getOrCreateKnowledgeGrid() {
        let grid = document.querySelector('.knowledge-grid');
        if (!grid) {
            grid = this.createKnowledgeSection();
        }
        return grid;
    }

    createTutorialsSection() {
        const section = document.createElement('section');
        section.className = 'section component';
        section.setAttribute('data-component', 'tutorials-section');
        section.innerHTML = `
            <div class="container">
                <h2 class="section-title editable" data-field="tutorials-title">Tutorials</h2>
                <div class="tutorials-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;"></div>
            </div>
            <div class="component-controls">
                <button class="edit-component">✏️</button>
                <button class="add-child" data-child-type="tutorial-card">➕ Tutorial</button>
                <button class="move-up">⬆️</button>
                <button class="move-down">⬇️</button>
                <button class="delete-component">🗑️</button>
            </div>
        `;
        
        const skillsSection = document.querySelector('[data-component="skills-section"]');
        if (skillsSection) {
            skillsSection.insertAdjacentElement('afterend', section);
        } else {
            document.getElementById('website-container')?.appendChild(section);
        }
        
        this.setupComponentControls(section);
        return section.querySelector('.tutorials-grid');
    }

    createSocialSection() {
        const section = document.createElement('section');
        section.className = 'section component';
        section.setAttribute('data-component', 'social-section');
        section.innerHTML = `
            <div class="container">
                <h2 class="section-title editable" data-field="social-title">Social Media</h2>
                <div class="social-links-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;"></div>
            </div>
            <div class="component-controls">
                <button class="edit-component">✏️</button>
                <button class="add-child" data-child-type="social-link">➕ Social Link</button>
                <button class="move-up">⬆️</button>
                <button class="move-down">⬇️</button>
                <button class="delete-component">🗑️</button>
            </div>
        `;
        
        const lastSection = document.querySelector('#website-container .section:last-of-type');
        if (lastSection) {
            lastSection.insertAdjacentElement('afterend', section);
        } else {
            document.getElementById('website-container')?.appendChild(section);
        }
        
        this.setupComponentControls(section);
        return section.querySelector('.social-links-grid');
    }

    createUpdatesSection() {
        const section = document.createElement('section');
        section.className = 'section component dark-section';
        section.setAttribute('data-component', 'updates-section');
        section.innerHTML = `
            <div class="container">
                <h2 class="section-title editable" data-field="updates-title">Neueste Updates</h2>
                <div class="updates-grid" style="display: flex; flex-direction: column; gap: 1rem;"></div>
            </div>
            <div class="component-controls">
                <button class="edit-component">✏️</button>
                <button class="add-child" data-child-type="update-item">➕ Update</button>
                <button class="move-up">⬆️</button>
                <button class="move-down">⬇️</button>
                <button class="delete-component">🗑️</button>
            </div>
        `;
        
        const lastSection = document.querySelector('#website-container .section:last-of-type');
        if (lastSection) {
            lastSection.insertAdjacentElement('afterend', section);
        } else {
            document.getElementById('website-container')?.appendChild(section);
        }
        
        this.setupComponentControls(section);
        return section.querySelector('.updates-grid');
    }

    createKnowledgeSection() {
        const section = document.createElement('section');
        section.className = 'section component';
        section.setAttribute('data-component', 'knowledge-section');
        section.innerHTML = `
            <div class="container">
                <h2 class="section-title editable" data-field="knowledge-title">Wissensdatenbank</h2>
                <div class="knowledge-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;"></div>
            </div>
            <div class="component-controls">
                <button class="edit-component">✏️</button>
                <button class="add-child" data-child-type="knowledge-category">➕ Kategorie</button>
                <button class="move-up">⬆️</button>
                <button class="move-down">⬇️</button>
                <button class="delete-component">🗑️</button>
            </div>
        `;
        
        const lastSection = document.querySelector('#website-container .section:last-of-type');
        if (lastSection) {
            lastSection.insertAdjacentElement('afterend', section);
        } else {
            document.getElementById('website-container')?.appendChild(section);
        }
        
        this.setupComponentControls(section);
        return section.querySelector('.knowledge-grid');
    }

    setupComponentControls(component) {
        const controls = component.querySelector('.component-controls');
        if (!controls) return;

        // Clear existing listeners
        const newControls = controls.cloneNode(true);
        controls.parentNode.replaceChild(newControls, controls);

        // Edit Component
        const editBtn = newControls.querySelector('.edit-component');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editComponent(component);
            });
        }

        // Delete Component
        const deleteBtn = newControls.querySelector('.delete-component');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteComponent(component);
            });
        }

        // Duplicate Component
        const duplicateBtn = newControls.querySelector('.duplicate-component');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.duplicateComponent(component);
            });
        }

        // Move Up/Down
        const moveUpBtn = newControls.querySelector('.move-up');
        const moveDownBtn = newControls.querySelector('.move-down');
        
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveComponent(component, 'up');
            });
        }
        
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveComponent(component, 'down');
            });
        }

        // Add Child
        const addChildBtn = newControls.querySelector('.add-child');
        if (addChildBtn) {
            addChildBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const childType = e.target.dataset.childType;
                const container = this.findChildContainer(component, childType);
                if (container) {
                    this.addComponent(childType, container);
                }
            });
        }
    }

    findChildContainer(component, childType) {
        const containerMappings = {
            'project-card': '.projects-grid',
            'skill-item': '.skills-grid',
            'tutorial-card': '.tutorials-grid',
            'social-link': '.social-links-grid',
            'update-item': '.updates-grid',
            'knowledge-category': '.knowledge-grid'
        };
        
        const selector = containerMappings[childType];
        return selector ? component.querySelector(selector) : null;
    }

    handleComponentControls(e) {
        if (e.target.classList.contains('edit-component')) {
            e.stopPropagation();
            const component = e.target.closest('.component');
            this.editComponent(component);
        }
        
        if (e.target.classList.contains('delete-component')) {
            e.stopPropagation();
            const component = e.target.closest('.component');
            this.deleteComponent(component);
        }
        
        if (e.target.classList.contains('duplicate-component')) {
            e.stopPropagation();
            const component = e.target.closest('.component');
            this.duplicateComponent(component);
        }
    }

    editComponent(component) {
        const componentId = component.getAttribute('data-component-id');
        const editables = component.querySelectorAll('.editable');
        
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-form');
        
        if (!modal || !form) return;
        
        // Clear previous form
        form.innerHTML = '';
        
        // Generate form fields
        editables.forEach(editable => {
            const field = editable.dataset.field;
            if (!field) return;
            
            const currentValue = editable.textContent || editable.value || '';
            const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/-/g, ' ');
            
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            if (currentValue.length > 50 || field.includes('description')) {
                formGroup.innerHTML = `
                    <label>${label}:</label>
                    <textarea data-field="${field}" rows="3">${currentValue}</textarea>
                `;
            } else {
                formGroup.innerHTML = `
                    <label>${label}:</label>
                    <input type="text" data-field="${field}" value="${currentValue}">
                `;
            }
            
            form.appendChild(formGroup);
        });
        
        // Store component reference
        modal.dataset.editingComponent = componentId;
        this.currentEditingComponent = component;
        modal.style.display = 'flex';
    }

    saveComponentChanges() {
        const modal = document.getElementById('edit-modal');
        const componentId = modal?.dataset.editingComponent;
        const component = this.currentEditingComponent;
        
        if (!component || !componentId) return;
        
        const formInputs = modal.querySelectorAll('[data-field]');
        
        formInputs.forEach(input => {
            const field = input.dataset.field;
            const newValue = input.value;
            const targetElement = component.querySelector(`[data-field="${field}"]`);
            
            if (targetElement) {
                if (targetElement.tagName.toLowerCase() === 'input') {
                    targetElement.value = newValue;
                } else {
                    targetElement.textContent = newValue;
                }
            }
        });
        
        // Update config
        this.updateComponentInConfig(componentId, this.getComponentData(component));
        
        this.closeModal();
        this.showNotification('Änderungen gespeichert!', 'success');
    }

    deleteComponent(component) {
        if (confirm('Komponente wirklich löschen?')) {
            const componentId = component.getAttribute('data-component-id');
            
            // Remove from config
            if (componentId) {
                this.removeComponentFromConfig(componentId);
            }
            
            // Animate out and remove
            component.style.opacity = '0';
            component.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                component.remove();
            }, 300);
            
            this.showNotification('Komponente gelöscht!', 'success');
        }
    }

    duplicateComponent(component) {
        const data = this.getComponentData(component);
        const type = this.getComponentType(component);
        const container = component.parentElement;
        
        // Modify data slightly for the duplicate
        if (data.title) {
            data.title += ' (Kopie)';
        }
        
        this.addComponent(type, container, data);
    }

    moveComponent(component, direction) {
        const sibling = direction === 'up' ? 
            component.previousElementSibling : 
            component.nextElementSibling;
        
        if (sibling && (sibling.classList.contains('component') || sibling.classList.contains('section'))) {
            if (direction === 'up') {
                sibling.insertAdjacentElement('beforebegin', component);
            } else {
                sibling.insertAdjacentElement('afterend', component);
            }
            
            // Update config order
            this.updateComponentOrder();
            this.showNotification(`Komponente nach ${direction === 'up' ? 'oben' : 'unten'} verschoben!`, 'success');
        }
    }

    getComponentData(component) {
        const data = {};
        const editables = component.querySelectorAll('.editable');
        
        editables.forEach(editable => {
            const field = editable.dataset.field;
            if (field) {
                data[field] = editable.textContent || editable.value || '';
            }
        });
        
        return data;
    }

    getComponentType(component) {
        // Try to determine type from classes or data attributes
        const classList = Array.from(component.classList);
        const possibleTypes = [
            'project-card', 'skill-item', 'tutorial-card', 
            'social-link', 'update-item', 'knowledge-category'
        ];
        
        for (const type of possibleTypes) {
            if (classList.includes(type)) {
                return type;
            }
        }
        
        // Fallback: check template attribute
        const template = component.getAttribute('data-template');
        if (template) return template;
        
        return 'unknown';
    }

    populateComponentData(component, data) {
        Object.keys(data).forEach(field => {
            const element = component.querySelector(`[data-field="${field}"]`);
            if (element && data[field]) {
                if (element.tagName.toLowerCase() === 'input') {
                    element.value = data[field];
                } else {
                    element.textContent = data[field];
                }
            }
        });
    }

    updateCSSVariables() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.currentConfig.colors.primary);
        root.style.setProperty('--accent-color', this.currentConfig.colors.accent);
    }

    toggleDarkMode(isDark) {
        document.body.classList.toggle('light-mode', !isDark);
    }

    // Configuration Management
    addComponentToConfig(id, type, data) {
        this.currentConfig.components.push({
            id,
            type,
            data: data || {},
            timestamp: Date.now()
        });
    }

    updateComponentInConfig(id, data) {
        const component = this.currentConfig.components.find(c => c.id === id);
        if (component) {
            component.data = data;
            component.lastModified = Date.now();
        }
    }

    removeComponentFromConfig(id) {
        this.currentConfig.components = this.currentConfig.components.filter(c => c.id !== id);
    }

    updateComponentOrder() {
        // Update the order in config based on DOM order
        const components = document.querySelectorAll('[data-component-id]');
        const newOrder = [];
        
        components.forEach((component, index) => {
            const id = component.getAttribute('data-component-id');
            const configComponent = this.currentConfig.components.find(c => c.id === id);
            if (configComponent) {
                configComponent.order = index;
                newOrder.push(configComponent);
            }
        });
        
        this.currentConfig.components = newOrder;
    }

    exportConfig() {
        // Update config with current state
        this.updateComponentOrder();
        
        const config = {
            ...this.currentConfig,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const configString = JSON.stringify(config, null, 2);
        const blob = new Blob([configString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Konfiguration exportiert!', 'success');
    }

    importConfig(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.loadConfiguration(config);
                this.showNotification('Konfiguration erfolgreich importiert!', 'success');
            } catch (error) {
                this.showNotification('Fehler beim Importieren der Konfiguration!', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Clear the input
        e.target.value = '';
    }

    loadConfiguration(config) {
        // Validate config structure
        if (!config.colors || !config.components) {
            throw new Error('Invalid configuration format');
        }
        
        this.currentConfig = {
            ...config,
            components: config.components || []
        };
        
        // Update UI controls
        const primaryColorInput = document.getElementById('primary-color');
        const accentColorInput = document.getElementById('accent-color');
        const darkModeInput = document.getElementById('dark-mode');
        
        if (primaryColorInput) primaryColorInput.value = config.colors.primary;
        if (accentColorInput) accentColorInput.value = config.colors.accent;
        if (darkModeInput) darkModeInput.checked = config.darkMode;
        
        this.updateCSSVariables();
        this.toggleDarkMode(config.darkMode);
        
        // Clear existing dynamic components
        this.clearDynamicComponents();
        
        // Recreate components from config
        config.components
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(componentConfig => {
                const container = this.getDefaultContainer(componentConfig.type);
                if (container) {
                    this.addComponent(componentConfig.type, container, componentConfig.data);
                }
            });
    }

    clearDynamicComponents() {
        // Only remove components with IDs (dynamically created)
        document.querySelectorAll('[data-component-id]').forEach(component => {
            component.remove();
        });
        
        // Also remove dynamically created sections
        const dynamicSections = [
            'tutorials-section', 'social-section', 
            'updates-section', 'knowledge-section'
        ];
        
        dynamicSections.forEach(sectionName => {
            const section = document.querySelector(`[data-component="${sectionName}"]`);
            if (section) {
                section.remove();
            }
        });
    }

    // Modal Management
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentEditingComponent = null;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    }

    // File Generation and Download
    generateFiles() {
        try {
            const html = this.generateHTML();
            const css = this.generateCSS();
            const js = this.generateJS();
            
            // Show in preview modal
            const htmlTextarea = document.getElementById('generated-html');
            const cssTextarea = document.getElementById('generated-css');
            const jsTextarea = document.getElementById('generated-js');
            
            if (htmlTextarea) htmlTextarea.value = html;
            if (cssTextarea) cssTextarea.value = css;
            if (jsTextarea) jsTextarea.value = js;
            
            // Create preview
            this.createPreview(html, css, js);
            
            const modal = document.getElementById('preview-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
            
            this.showNotification('Website-Dateien generiert!', 'success');
        } catch (error) {
            this.showNotification('Fehler beim Generieren der Dateien!', 'error');
            console.error('Generation error:', error);
        }
    }

    createPreview(html, css, js) {
        const previewFrame = document.getElementById('preview-frame');
        if (!previewFrame) return;
        
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        previewDoc.open();
        previewDoc.write(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Portfolio Preview</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
            </html>
        `);
        previewDoc.close();
    }

    generateHTML() {
        const container = document.getElementById('website-container');
        if (!container) return '';
        
        const clonedContainer = container.cloneNode(true);
        
        // Remove editor-specific elements
        clonedContainer.querySelectorAll('.component-controls').forEach(el => el.remove());
        clonedContainer.querySelectorAll('.baukasten-panel').forEach(el => el.remove());
        
        // Clean up editable elements
        clonedContainer.querySelectorAll('.editable').forEach(el => {
            el.removeAttribute('data-field');
            el.removeAttribute('contenteditable');
            el.classList.remove('editable');
        });
        
        // Clean up component elements
        clonedContainer.querySelectorAll('.component').forEach(el => {
            el.removeAttribute('data-component-id');
            el.classList.remove('component', 'fade-in', 'visible');
        });
        
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    ${clonedContainer.innerHTML}
    <script src="script.js"></script>
</body>
</html>`;
    }

    generateCSS() {
        const customColors = `
:root {
    --primary-color: ${this.currentConfig.colors.primary};
    --accent-color: ${this.currentConfig.colors.accent};
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    --bg-primary: ${this.currentConfig.darkMode ? '#0a0a0a' : '#ffffff'};
    --bg-secondary: ${this.currentConfig.darkMode ? '#18181b' : '#f8fafc'};
    --text-primary: ${this.currentConfig.darkMode ? '#e4e4e7' : '#1f2937'};
    --text-secondary: ${this.currentConfig.darkMode ? '#a1a1aa' : '#6b7280'};
    --border-color: ${this.currentConfig.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
}`;

        const baseCSS = `
/* Portfolio Website Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
header {
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 8px;
}

.nav-links a:hover {
    color: var(--primary-color);
    background: rgba(59, 130, 246, 0.1);
}

/* Hero Section */
.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(45deg, var(--bg-primary) 0%, #1e1e1e 50%, var(--bg-primary) 100%);
}

.hero h1 {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero p {
    font-size: 1.3rem;
    margin-bottom: 3rem;
    color: var(--text-secondary);
}

.cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    color: white;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(59, 130, 246, 0.6);
}

/* Sections */
.section {
    padding: 6rem 0;
}

.dark-section {
    background: linear-gradient(135deg, var(--bg-secondary), #09090b);
}

.section-title {
    font-size: 3rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 4rem;
    color: var(--text-primary);
}

/* Project Grid */
.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.project-card {
    background: linear-gradient(145deg, var(--bg-secondary), #27272a);
    border-radius: 20px;
    padding: 2rem;
    border: 1px solid var(--border-color);
    transition: all 0.4s ease;
}

.project-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
}

.project-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
}

.project-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.project-card p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.7;
}

.tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tech-tag {
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

/* Skills Grid */
.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.skill-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.skill-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-5px);
}

.skill-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
}

/* Tutorial Cards */
.tutorial-card {
    background: linear-gradient(145deg, var(--bg-secondary), #27272a);
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.tutorial-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.tutorial-thumbnail {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
}

.tutorial-icon {
    font-size: 2.5rem;
}

.tutorial-content {
    padding: 1.5rem;
}

.tutorial-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 1rem;
}

/* Social Links */
.social-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
}

.social-link:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.social-emoji {
    font-size: 1.5rem;
}

/* Update Items */
.update-item {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border-left: 4px solid var(--primary-color);
    margin-bottom: 1rem;
}

/* Animations */
.fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease;
}

.fade-in.visible {
    opacity: 1;
    transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }
    
    .section-title {
        font-size: 2rem;
    }
    
    .projects-grid,
    .skills-grid {
        grid-template-columns: 1fr;
    }
    
    .nav-links {
        display: none;
    }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    border-radius: 4px;
}`;

        return customColors + '\n' + baseCSS;
    }

    generateJS() {
        return `
// Portfolio Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Intersection Observer for scroll animations
    const observerOptions = { 
        threshold: 0.1, 
        rootMargin: '0px 0px -50px 0px' 
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    // Card hover effects
    document.querySelectorAll('.project-card, .skill-item, .tutorial-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add fade-in class to elements that should animate
    document.querySelectorAll('.project-card, .skill-item, .tutorial-card, .social-link').forEach((element, index) => {
        element.classList.add('fade-in');
        // Stagger the animations
        element.style.animationDelay = (index * 0.1) + 's';
    });
    
    // Navbar background on scroll
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (header) {
            if (currentScrollY > 100) {
                header.style.background = 'rgba(10, 10, 10, 0.98)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = 'rgba(10, 10, 10, 0.95)';
            }
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Simple contact form handling (if exists)
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Vielen Dank für Ihre Nachricht! (Demo-Modus)');
        });
    }
});`;
    }

    downloadFiles() {
        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();
        
        // Create and download HTML file
        this.downloadFile('index.html', html, 'text/html');
        
        // Create and download CSS file
        this.downloadFile('style.css', css, 'text/css');
        
        // Create and download JS file
        this.downloadFile('script.js', js, 'text/javascript');
        
        this.showNotification('Alle Dateien wurden heruntergeladen!', 'success');
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Drag and Drop functionality
    setupDragAndDrop() {
        // Make components draggable
        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('component') || e.target.closest('.component')) {
                const component = e.target.classList.contains('component') ? e.target : e.target.closest('.component');
                this.initDrag(component, e);
            }
        });
    }

    initDrag(element, e) {
        // Only allow dragging from specific areas to avoid interfering with editing
        const isDraggable = e.target.classList.contains('component-controls') || 
                           e.target.closest('.component-controls');
        
        if (!isDraggable) return;
        
        let isDragging = false;
        let startX = e.clientX;
        let startY = e.clientY;
        
        const onMouseMove = (e) => {
            if (!isDragging) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2)
                );
                if (distance > 10) {
                    isDragging = true;
                    element.classList.add('dragging');
                    this.draggedElement = element;
                }
            }
        };
        
        const onMouseUp = () => {
            if (isDragging) {
                element.classList.remove('dragging');
                this.draggedElement = null;
                isDragging = false;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    loadTemplates() {
        // Templates are already in the HTML, this method can be used
        // to add any additional template processing if needed
        console.log('Templates loaded');
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 
                        type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 21000;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Debug helper
    getConfigSnapshot() {
        return JSON.stringify(this.currentConfig, null, 2);
    }

    // Initialize missing templates if needed
    createMissingTemplates() {
        const templates = {
            'update-item': `
                <div class="update-item template" data-template="update-item">
                    <div class="update-date editable" data-field="date">📅 ${new Date().toLocaleDateString('de-DE')}</div>
                    <h4 class="editable" data-field="title">Update Titel</h4>
                    <p class="editable" data-field="description">Update Beschreibung</p>
                    <div class="component-controls">
                        <button class="edit-component">✏️</button>
                        <button class="duplicate-component">📋</button>
                        <button class="delete-component">🗑️</button>
                    </div>
                </div>
            `,
            'knowledge-category': `
                <div class="knowledge-category template" data-template="knowledge-category">
                    <span class="knowledge-icon editable" data-field="icon">🧠</span>
                    <h3 class="editable" data-field="title">Wissensbreich</h3>
                    <p class="editable" data-field="description">Beschreibung des Wissensbereichs</p>
                    <div class="knowledge-topics">
                        <span class="topic-tag editable" data-field="topic1">Thema 1</span>
                        <span class="topic-tag editable" data-field="topic2">Thema 2</span>
                    </div>
                    <div class="component-controls">
                        <button class="edit-component">✏️</button>
                        <button class="duplicate-component">📋</button>
                        <button class="delete-component">🗑️</button>
                    </div>
                </div>
            `
        };
        
        const templateContainer = document.getElementById('component-templates');
        if (!templateContainer) return;
        
        Object.entries(templates).forEach(([type, html]) => {
            if (!document.querySelector(`[data-template="${type}"]`)) {
                templateContainer.insertAdjacentHTML('beforeend', html);
            }
        });
    }
}

// Initialize the Baukasten system when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.portfolioBaukasten = new PortfolioBaukasten();
    
    // Add some helpful console methods for development
    window.exportConfig = () => window.portfolioBaukasten.exportConfig();
    window.getConfig = () => window.portfolioBaukasten.getConfigSnapshot();
    
    console.log('Portfolio Baukasten initialisiert! 🚀');
    console.log('Verwende window.exportConfig() oder window.getConfig() in der Konsole für Debug-Zwecke.');
});
