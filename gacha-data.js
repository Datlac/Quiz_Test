const CHAR_ELEMENTS = {
    FIRE: { name: 'Fire', icon: '🔥', color: '#e74c3c' },
    WIND: { name: 'Wind', icon: '🍃', color: '#2ecc71' },
    WATER: { name: 'Water', icon: '💧', color: '#3498db' },
    EARTH: { name: 'Earth', icon: '🪨', color: '#f1c40f' },
    QUANTUM: { name: 'Quantum', icon: '⚛️', color: '#9b59b6' }
};

const GACHA_POOL = [
    // 5-STAR
    { 
        id: 'c5_001', name: 'Cyber Scholar', rarity: 5, element: 'QUANTUM', path: 'Erudition', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberScholar', 
        desc: 'Master of algorithms.',
        stats: { hp: 120, atk: 25, def: 10, spd: 110 },
        skills: {
            basic: { name: 'Binary Strike', mult: 1.0, type: 'single' },
            skill: { name: 'Data Storm', mult: 1.5, type: 'aoe', cost: 1 },
            ult: { name: 'Quantum Collapse', mult: 3.0, type: 'aoe', cost: 3 }
        }
    },
    { 
        id: 'c5_002', name: 'Neural Networker', rarity: 5, element: 'WIND', path: 'Nihility', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neural', 
        desc: 'Connects all things.',
        stats: { hp: 110, atk: 22, def: 12, spd: 115 },
        skills: {
            basic: { name: 'Synapse Snap', mult: 1.0, type: 'single' },
            skill: { name: 'Viral Loop', mult: 1.2, type: 'single', dot: true, cost: 1 },
            ult: { name: 'Deep Learning', mult: 2.8, type: 'single', cost: 3 }
        }
    },
    // 4-STAR
    { 
        id: 'c4_001', name: 'Data Miner', rarity: 4, element: 'EARTH', path: 'Destruction', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miner', 
        desc: 'Digs deep for truth.',
        stats: { hp: 140, atk: 18, def: 15, spd: 95 },
        skills: {
            basic: { name: 'Pickaxe', mult: 1.0, type: 'single' },
            skill: { name: 'Excavate', mult: 1.8, type: 'single', selfDmg: 0.1, cost: 1 },
            ult: { name: 'Earthquake', mult: 2.5, type: 'aoe', cost: 3 }
        }
    },
    { 
        id: 'c4_002', name: 'Firewall Guard', rarity: 4, element: 'FIRE', path: 'Preservation', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SysAdmin', 
        desc: 'The unbreachable wall.',
        stats: { hp: 160, atk: 12, def: 25, spd: 90 },
        skills: {
            basic: { name: 'Block', mult: 0.8, type: 'single' },
            skill: { name: 'Encryption', effect: 'shield', val: 0.2, type: 'team', cost: 1 },
            ult: { name: 'System Lockdown', mult: 2.0, type: 'single', stun: true, cost: 3 }
        }
    },
    { 
        id: 'c4_003', name: 'Bug Hunter', rarity: 4, element: 'WATER', path: 'Hunt', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hunter', 
        desc: 'Eliminates errors.',
        stats: { hp: 100, atk: 28, def: 8, spd: 120 },
        skills: {
            basic: { name: 'Quick Fix', mult: 1.0, type: 'single' },
            skill: { name: 'Patch 1.0', mult: 2.2, type: 'single', cost: 1 },
            ult: { name: 'Hotfix Deploy', mult: 3.5, type: 'single', cost: 3 }
        }
    },
    // 3-STAR
    { 
        id: 'c3_001', name: 'Script Kiddie', rarity: 3, element: 'WIND', path: 'Abundance', 
        img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiddie', 
        desc: 'Learning the ropes.',
        stats: { hp: 90, atk: 15, def: 8, spd: 100 },
        skills: {
            basic: { name: 'Copy Paste', mult: 1.0, type: 'single' },
            skill: { name: 'Reboot', effect: 'heal', val: 0.15, type: 'single', cost: 1 },
            ult: { name: 'StackOverflow', mult: 2.0, type: 'random', cost: 3 }
        }
    }
];

function getCharData(id) {
    return GACHA_POOL.find(c => c.id === id);
}
