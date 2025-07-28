let wikiData = {
    sections: {},
    currentSection: null
};

let sectionIdCounter = 1;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderSectionTree();
    showWelcomeScreen();
});

function generateId() {
    return 'section_' + (sectionIdCounter++);
}

function saveData() {
    localStorage.setItem('wikiData', JSON.stringify(wikiData));
    localStorage.setItem('sectionIdCounter', sectionIdCounter.toString());
}

function loadData() {
    const saved = localStorage.getItem('wikiData');
    const savedCounter = localStorage.getItem('sectionIdCounter');
    
    if (saved) {
        wikiData = JSON.parse(saved);
    }
    
    if (savedCounter) {
        sectionIdCounter = parseInt(savedCounter);
    }
    
    // Si no hay datos, crear ejemplos
    if (Object.keys(wikiData.sections).length === 0) {
        createExampleData();
    }
}

function createExampleData() {
    wikiData.sections = {
        'section_1': {
            id: 'section_1',
            name: '🏠 Inicio',
            content: 'Bienvenido a la wiki de tu bot de Discord.\n\nAquí encontrarás toda la información necesaria para usar y configurar el bot correctamente.',
            children: {},
            parentId: null
        },
        'section_2': {
            id: 'section_2',
            name: '⚙️ Configuración',
            content: 'Configuración inicial del bot:\n\n1. Invita el bot a tu servidor\n2. Configura los permisos necesarios\n3. Establece el prefijo de comandos\n4. Configura los canales específicos',
            children: {
                'section_3': {
                    id: 'section_3',
                    name: 'Permisos',
                    content: 'Lista de permisos necesarios:\n\n• Leer mensajes\n• Enviar mensajes\n• Gestionar mensajes\n• Usar emojis externos\n• Adjuntar archivos',
                    children: {},
                    parentId: 'section_2'
                }
            },
            parentId: null
        },
        'section_4': {
            id: 'section_4',
            name: '📋 Comandos',
            content: 'Lista de comandos disponibles:\n\n!help - Muestra este mensaje de ayuda\n!ping - Verifica la latencia del bot\n!info - Información del servidor',
            children: {},
            parentId: null
        }
    };
    sectionIdCounter = 5;
    saveData();
}

function exportData() {
    const dataStr = JSON.stringify(wikiData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'wiki-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.sections) {
                wikiData = imported;
                saveData();
                renderSectionTree();
                showWelcomeScreen();
                alert('¡Datos importados correctamente!');
            }
        } catch (error) {
            alert('Error al importar el archivo. Verifica que sea un archivo JSON válido.');
        }
    };
    reader.readAsText(file);
}

function showAddSectionModal(parentId = null) {
    document.getElementById('sectionModal').classList.add('active');
    document.getElementById('newSectionName').value = '';
    document.getElementById('newSectionName').dataset.parentId = parentId || '';
    document.getElementById('newSectionName').focus();
}

function closeModal() {
    document.getElementById('sectionModal').classList.remove('active');
}

function addSection() {
    const name = document.getElementById('newSectionName').value.trim();
    const parentId = document.getElementById('newSectionName').dataset.parentId;
    
    if (!name) return;

    const sectionId = generateId();
    const section = {
        id: sectionId,
        name: name,
        content: '',
        children: {},
        parentId: parentId || null
    };

    if (parentId) {
        wikiData.sections[parentId].children[sectionId] = section;
    } else {
        wikiData.sections[sectionId] = section;
    }

    saveData();
    renderSectionTree();
    closeModal();
    selectSection(sectionId);
}

function addSubsection(parentId) {
    showAddSectionModal(parentId);
}

function editSection(sectionId) {
    const section = findSection(sectionId);
    if (!section) return;

    const newName = prompt('Nuevo nombre:', section.name);
    if (newName && newName.trim()) {
        section.name = newName.trim();
        saveData();
        renderSectionTree();
        if (wikiData.currentSection === sectionId) {
            document.getElementById('sectionTitle').value = section.name;
        }
    }
}

function deleteSection(sectionId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sección y todas sus subsecciones?')) {
        return;
    }

    const section = findSection(sectionId);
    if (!section) return;

    if (section.parentId) {
        const parent = findSection(section.parentId);
        delete parent.children[sectionId];
    } else {
        delete wikiData.sections[sectionId];
    }

    if (wikiData.currentSection === sectionId) {
        wikiData.currentSection = null;
        showWelcomeScreen();
    }

    saveData();
    renderSectionTree();
}

function findSection(sectionId) {
    function searchInSections(sections) {
        for (let id in sections) {
            if (id === sectionId) {
                return sections[id];
            }
            const found = searchInSections(sections[id].children);
            if (found) return found;
        }
        return null;
    }
    return searchInSections(wikiData.sections);
}

function selectSection(sectionId) {
    const section = findSection(sectionId);
    if (!section) return;

    wikiData.currentSection = sectionId;
    
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('contentEditor').classList.add('active');
    
    document.getElementById('sectionTitle').value = section.name;
    document.getElementById('sectionContent').value = section.content;

    document.querySelectorAll('.section-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section-id="${sectionId}"]`)?.classList.add('active');
}

function saveSection() {
    if (!wikiData.currentSection) return;

    const section = findSection(wikiData.currentSection);
    if (!section) return;

    section.name = document.getElementById('sectionTitle').value;
    section.content = document.getElementById('sectionContent').value;

    saveData();
    renderSectionTree();
    
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Guardado';
    saveBtn.style.background = 'linear-gradient(45deg, #2ed573, #7bed9f)';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = 'linear-gradient(45deg, #00d2d3, #54a0ff)';
    }, 1500);
}

function showWelcomeScreen() {
    document.getElementById('welcomeScreen').style.display = 'block';
    document.getElementById('contentEditor').classList.remove('active');
    wikiData.currentSection = null;
    
    document.querySelectorAll('.section-link').forEach(link => {
        link.classList.remove('active');
    });
}

function renderSectionTree() {
    const tree = document.getElementById('sectionTree');
    tree.innerHTML = '';

    function renderSections(sections, container, level = 0) {
        for (let sectionId in sections) {
            const section = sections[sectionId];
            const li = document.createElement('li');
            li.className = 'section-item' + (level > 0 ? ' subsection' : '');
            
            li.innerHTML = `
                <div class="section-link" data-section-id="${sectionId}" onclick="selectSection('${sectionId}')">
                    ${section.name}
                    <div class="section-actions">
                        <button class="action-btn add-sub-btn" onclick="event.stopPropagation(); addSubsection('${sectionId}')" title="Agregar subsección">+</button>
                        <button class="action-btn edit-btn" onclick="event.stopPropagation(); editSection('${sectionId}')" title="Editar">✏️</button>
                        <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteSection('${sectionId}')" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
            
            container.appendChild(li);
            
            if (Object.keys(section.children).length > 0) {
                const subList = document.createElement('ul');
                subList.className = 'section-tree';
                li.appendChild(subList);
                renderSections(section.children, subList, level + 1);
            }
        }
    }

    renderSections(wikiData.sections, tree);
}

// Event listeners
document.getElementById('newSectionName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addSection();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (wikiData.currentSection) {
            saveSection();
        }
    }
});