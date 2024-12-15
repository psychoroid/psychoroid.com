const adjectives = [
    'magnificent', 'distinguished', 'awesome', 'brilliant', 'cosmic',
    'legendary', 'mysterious', 'noble', 'radiant', 'spectacular',
    'majestic', 'fantastic', 'incredible', 'supreme', 'space','stellar',
    'mighty', 'epic', 'grand', 'heroic', 'phenomenal',
    'esteemed', 'exceptional', 'preferred', 'honored', 'respected',
    'prestigious', 'elite', 'premium', 'distinguished',
    'glorious', 'illustrious', 'eminent', 'notable', 'venerable',
    'jazzy', 'fancy', 'super', 'ultra', 'mega', 'hyper', 'turbo',
    'cool', 'amazing', 'fabulous', 'marvelous', 'splendid',
    'dazzling', 'sparkly', 'shiny','glittering',
    'unstoppable', 'unbeatable', 'invincible', 'ultimate', 'undisputed', 'unmatched', 'undefeated', 'unrivaled', 'unparalleled', 'quantum', 'cyber', 'digital', 'techno', 'neo',
    'power', 'prime', 'alpha', 'omega', 'ultra'
]

const nouns = [
    'user', 'master','phoenix', 'dragon', 'sage', 'pioneer',
    'titan', 'explorer', 'genius', 'adventurer',
    'goat', 'boss', 'chief', 'captain', 'hero',
    'bigdawg', 'broski', 'client', 'patron', 'anon',
    'member', 'customer', 'vip', 'ace', 'maestro', 'A-player',
    'sovereign', 'mogul', 'hotshot', 'rockstar',
    'unicorn', 'dinosaur', 'panda', 'penguin', 'raccoon',
    'samurai', 'viking', 'pirate', 'astronaut', 'adventurer',
    'superstar', 'maverick', 'prodigy', 'virtuoso',
    'sensei', 'guru', 'jedi', 'ninja', 'warrior',
    'beast', 'machine', 'robot', 'cyborg', 'android',
    'legend', 'champion', 'winner',
    'wizard', 'sorcerer', 'mage', 'alchemist',
    'pogchamp', 'memelord', 'kingpin', 'chad',
    'gigachad', 'megamind', 'bigbrain', 'mastermind'
]

const prefixes = [
    'the', 'mr', 'ms', 'dr', 'prof',
    'sir', 'lord', 'lady', 'chief', 'master', 'chief', 'big-boss', 'king', 'queen'
]

const suffixes = [
    'oftheuniverse', 'supreme', 'prime', 'elite', 'pro',
    'master', 'expert', 'guru', 'wizard', 'sage', 'cobra',
    'legend', 'goat', 'boss', 'king', 'queen', 'of-the-world', 'of-the-universe', 'of-the-galaxy', 'of-the-multiverse', 'of-the-multiverse', '-san'
]

export function generateUsername(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 999) + 1
    
    const usePrefix = Math.random() < 0.2
    const useSuffix = Math.random() < 0.2
    
    const prefix = usePrefix ? prefixes[Math.floor(Math.random() * prefixes.length)] : ''
    const suffix = useSuffix ? suffixes[Math.floor(Math.random() * suffixes.length)] : ''
    
    const style = Math.random()
    
    if (style < 0.5) {
        return `${adjective.toLowerCase()}${noun.charAt(0).toUpperCase()}${noun.slice(1)}${Math.random() > 0.5 ? number : ''}`
    }
    else if (style < 0.7) {
        return `${adjective.toLowerCase()}_${noun.toLowerCase()}${Math.random() > 0.5 ? '_' + number : ''}`
    }
    else if (style < 0.8 && usePrefix) {
        return `${prefix}${adjective.charAt(0).toUpperCase()}${adjective.slice(1)}${noun.charAt(0).toUpperCase()}${noun.slice(1)}`
    }
    else if (style < 0.9 && useSuffix) {
        return `${adjective.toLowerCase()}${noun.toLowerCase()}${suffix}${Math.random() > 0.7 ? number : ''}`
    }
    else {
        return `${adjective.charAt(0).toUpperCase()}${adjective.slice(1)}${noun.charAt(0).toUpperCase()}${noun.slice(1)}${useSuffix ? '_' + suffix : ''}${Math.random() > 0.6 ? number : ''}`
    }
} 