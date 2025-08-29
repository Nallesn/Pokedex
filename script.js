// Estado da aplicação
let currentPage = 1;
let pokemonPerPage = 20;
let allPokemon = [];
let filteredPokemon = [];
let isLoading = false;

// Elementos DOM
const pokemonListDiv = document.getElementById('pokemon-list');
const loadingDiv = document.getElementById('loading');
const loadMoreBtn = document.getElementById('load-more');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const surpriseBtn = document.getElementById('surprise-btn');
const typeFilter = document.getElementById('type-filter');
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');

// Tradução de tipos para português
const typeTranslations = {
    normal: 'Normal',
    fire: 'Fogo',
    water: 'Água',
    electric: 'Elétrico',
    grass: 'Planta',
    ice: 'Gelo',
    fighting: 'Luta',
    poison: 'Veneno',
    ground: 'Terra',
    flying: 'Voador',
    psychic: 'Psíquico',
    bug: 'Inseto',
    rock: 'Pedra',
    ghost: 'Fantasma',
    dragon: 'Dragão',
    dark: 'Sombrio',
    steel: 'Aço',
    fairy: 'Fada'
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    loadPokemon();
}

function setupEventListeners() {
    // Busca
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Botão surpresa
    surpriseBtn.addEventListener('click', handleSurprise);

    // Filtro de tipo
    typeFilter.addEventListener('change', handleTypeFilter);

    // Carregar mais
    loadMoreBtn.addEventListener('click', loadMorePokemon);

    // Modal
    closeModal.addEventListener('click', closeModalHandler);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModalHandler();
        }
    });
}

async function loadPokemon() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();

    try {
        const promises = [];
        const startId = (currentPage - 1) * pokemonPerPage + 1;
        const endId = Math.min(startId + pokemonPerPage - 1, 1010); // Limite da API

        for (let i = startId; i <= endId; i++) {
            promises.push(fetchPokemon(i));
        }

        const pokemonData = await Promise.all(promises);
        const validPokemon = pokemonData.filter(pokemon => pokemon !== null);
        
        allPokemon.push(...validPokemon);
        filteredPokemon = [...allPokemon];
        
        renderPokemon(validPokemon);
        
        if (endId < 1010) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }

    } catch (error) {
        console.error('Erro ao carregar Pokémon:', error);
        showError('Erro ao carregar Pokémon. Tente novamente.');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

async function fetchPokemon(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!response.ok) return null;
        
        const pokemon = await response.json();
        
        // Buscar informações da espécie para descrição
        const speciesResponse = await fetch(pokemon.species.url);
        const speciesData = await speciesResponse.json();
        
        return {
            ...pokemon,
            species: speciesData
        };
    } catch (error) {
        console.error(`Erro ao buscar Pokémon ${id}:`, error);
        return null;
    }
}

function renderPokemon(pokemonList) {
    pokemonList.forEach(pokemon => {
        if (pokemon) {
            const pokemonCard = createPokemonCard(pokemon);
            pokemonListDiv.appendChild(pokemonCard);
        }
    });
}

function createPokemonCard(pokemon) {
    const pokemonCard = document.createElement('div');
    pokemonCard.classList.add('pokemon-card');
    pokemonCard.addEventListener('click', () => showPokemonDetails(pokemon));

    const pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    const pokemonId = String(pokemon.id).padStart(3, '0');
    const pokemonTypes = pokemon.types.map(type => type.type.name);

    pokemonCard.innerHTML = `
        <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
             alt="${pokemonName}" 
             loading="lazy">
        <div class="pokemon-number">#${pokemonId}</div>
        <h2>${pokemonName}</h2>
        <div class="pokemon-types">
            ${pokemonTypes.map(type => 
                `<span class="type-badge type-${type}">${typeTranslations[type] || type}</span>`
            ).join('')}
        </div>
    `;

    return pokemonCard;
}

async function showPokemonDetails(pokemon) {
    modal.style.display = 'block';
    
    const pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    const pokemonId = String(pokemon.id).padStart(3, '0');
    const pokemonTypes = pokemon.types.map(type => type.type.name);
    
    // Buscar descrição em português
    let description = 'Descrição não disponível.';
    if (pokemon.species && pokemon.species.flavor_text_entries) {
        const ptDescription = pokemon.species.flavor_text_entries.find(
            entry => entry.language.name === 'pt'
        );
        if (ptDescription) {
            description = ptDescription.flavor_text.replace(/\f/g, ' ');
        }
    }

    // Estatísticas
    const stats = pokemon.stats.map(stat => ({
        name: translateStatName(stat.stat.name),
        value: stat.base_stat
    }));

    // Habilidades
    const abilities = pokemon.abilities.map(ability => 
        ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)
    );

    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
                 alt="${pokemonName}" 
                 style="width: 200px; height: 200px; object-fit: contain;">
            <h2 style="margin: 1rem 0; font-size: 2rem;">#${pokemonId} ${pokemonName}</h2>
            <div class="pokemon-types">
                ${pokemonTypes.map(type => 
                    `<span class="type-badge type-${type}">${typeTranslations[type] || type}</span>`
                ).join('')}
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: #333;">Descrição</h3>
            <p style="line-height: 1.6; color: #666;">${description}</p>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: #333;">Informações</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div><strong>Altura:</strong> ${pokemon.height / 10} m</div>
                <div><strong>Peso:</strong> ${pokemon.weight / 10} kg</div>
                <div><strong>Experiência Base:</strong> ${pokemon.base_experience}</div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: #333;">Habilidades</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${abilities.map(ability => 
                    `<span style="background: #f0f0f0; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">${ability}</span>`
                ).join('')}
            </div>
        </div>

        <div>
            <h3 style="margin-bottom: 1rem; color: #333;">Estatísticas Base</h3>
            <div style="display: grid; gap: 0.5rem;">
                ${stats.map(stat => `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 500;">${stat.name}:</span>
                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1; margin-left: 1rem;">
                            <div style="background: #f0f0f0; height: 20px; border-radius: 10px; flex: 1; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #4ecdc4, #44a08d); height: 100%; width: ${Math.min(stat.value / 2, 100)}%; transition: width 0.3s ease;"></div>
                            </div>
                            <span style="font-weight: 600; min-width: 30px; text-align: right;">${stat.value}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function translateStatName(statName) {
    const translations = {
        'hp': 'HP',
        'attack': 'Ataque',
        'defense': 'Defesa',
        'special-attack': 'Ataque Especial',
        'special-defense': 'Defesa Especial',
        'speed': 'Velocidade'
    };
    return translations[statName] || statName;
}

function closeModalHandler() {
    modal.style.display = 'none';
}

function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        filteredPokemon = [...allPokemon];
        renderFilteredPokemon();
        return;
    }

    // Buscar por nome ou número
    filteredPokemon = allPokemon.filter(pokemon => 
        pokemon.name.toLowerCase().includes(searchTerm) || 
        pokemon.id.toString().includes(searchTerm)
    );

    renderFilteredPokemon();
}

function handleSurprise() {
    if (allPokemon.length === 0) return;
    
    const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
    showPokemonDetails(randomPokemon);
}

function handleTypeFilter() {
    const selectedType = typeFilter.value;
    
    if (!selectedType) {
        filteredPokemon = [...allPokemon];
    } else {
        filteredPokemon = allPokemon.filter(pokemon =>
            pokemon.types.some(type => type.type.name === selectedType)
        );
    }
    
    renderFilteredPokemon();
}

function renderFilteredPokemon() {
    pokemonListDiv.innerHTML = '';
    renderPokemon(filteredPokemon);
    
    // Esconder botão "Carregar mais" quando há filtros ativos
    if (filteredPokemon.length < allPokemon.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = currentPage * pokemonPerPage < 1010 ? 'block' : 'none';
    }
}

function loadMorePokemon() {
    currentPage++;
    loadPokemon();
}

function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

