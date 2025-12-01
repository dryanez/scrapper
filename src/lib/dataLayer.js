// Unified Data Layer - Uses Supabase when configured, localStorage as fallback
import { supabase, useSupabase } from '@/lib/supabase';

// ============================================
// localStorage helpers (fallback)
// ============================================
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================
// Column name mapping (app uses _date, Supabase uses _at)
// ============================================
const mapColumnName = (column) => {
  const mapping = {
    'created_date': 'created_at',
    'updated_date': 'updated_at',
    'appliedAt': 'applied_at',
    'isActive': 'is_active',
  };
  return mapping[column] || column;
};

// ============================================
// Supabase CRUD operations
// ============================================
const createSupabaseEntity = (tableName) => {
  return {
    list: async (orderBy = '-created_at', limit = 1000) => {
      const isDesc = orderBy.startsWith('-');
      const column = mapColumnName(orderBy.replace('-', ''));
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDesc })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },

    filter: async (filters = {}) => {
      let query = supabase.from(tableName).select('*');
      
      Object.entries(filters).forEach(([key, value]) => {
        const mappedKey = mapColumnName(key);
        if (Array.isArray(value)) {
          query = query.in(mappedKey, value);
        } else {
          query = query.eq(mappedKey, value);
        }
      });
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    create: async (entityData) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          ...entityData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },

    bulkCreate: async (items) => {
      const itemsWithTimestamps = items.map(item => ({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(itemsWithTimestamps)
        .select();
      
      if (error) throw error;
      return data || [];
    },

    bulkDelete: async (ids) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return { success: true, deleted: ids.length };
    },

    // Upsert - insert or update based on unique constraint
    upsert: async (items, onConflict = 'id') => {
      const itemsWithTimestamps = (Array.isArray(items) ? items : [items]).map(item => ({
        ...item,
        updated_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from(tableName)
        .upsert(itemsWithTimestamps, { onConflict })
        .select();
      
      if (error) throw error;
      return data || [];
    }
  };
};

// ============================================
// localStorage CRUD operations (fallback)
// ============================================
const createLocalStorageEntity = (entityName) => {
  const storageKey = `med_match_${entityName.toLowerCase()}`;
  
  return {
    list: async (orderBy = '-created_date', limit = 1000) => {
      let data = getStorageData(storageKey);
      
      // Sort
      const isDesc = orderBy.startsWith('-');
      const field = orderBy.replace('-', '');
      data.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        return isDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });
      
      return data.slice(0, limit);
    },

    filter: async (filters = {}) => {
      const data = getStorageData(storageKey);
      return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    },

    get: async (id) => {
      const data = getStorageData(storageKey);
      return data.find(item => item.id === id) || null;
    },

    create: async (entityData) => {
      const data = getStorageData(storageKey);
      const newItem = {
        id: generateId(),
        ...entityData,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      data.push(newItem);
      setStorageData(storageKey, data);
      return newItem;
    },

    update: async (id, updates) => {
      const data = getStorageData(storageKey);
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = {
          ...data[index],
          ...updates,
          updated_date: new Date().toISOString()
        };
        setStorageData(storageKey, data);
        return data[index];
      }
      throw new Error(`${entityName} with id ${id} not found`);
    },

    delete: async (id) => {
      const data = getStorageData(storageKey);
      const filtered = data.filter(item => item.id !== id);
      setStorageData(storageKey, filtered);
      return { success: true };
    },

    bulkCreate: async (items) => {
      const data = getStorageData(storageKey);
      const newItems = items.map(item => ({
        id: generateId(),
        ...item,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }));
      data.push(...newItems);
      setStorageData(storageKey, data);
      return newItems;
    },

    bulkDelete: async (ids) => {
      const data = getStorageData(storageKey);
      const filtered = data.filter(item => !ids.includes(item.id));
      setStorageData(storageKey, filtered);
      return { success: true, deleted: ids.length };
    },

    upsert: async (items) => {
      const data = getStorageData(storageKey);
      const itemsArray = Array.isArray(items) ? items : [items];
      
      itemsArray.forEach(item => {
        const index = data.findIndex(d => d.id === item.id);
        if (index !== -1) {
          data[index] = { ...data[index], ...item, updated_date: new Date().toISOString() };
        } else {
          data.push({ id: generateId(), ...item, created_date: new Date().toISOString(), updated_date: new Date().toISOString() });
        }
      });
      
      setStorageData(storageKey, data);
      return itemsArray;
    }
  };
};

// ============================================
// Create entity with automatic backend selection
// ============================================
const createEntity = (entityName, tableName) => {
  // Return an object that checks useSupabase() at runtime
  const supabaseEntity = useSupabase() ? createSupabaseEntity(tableName) : null;
  const localEntity = createLocalStorageEntity(entityName);
  
  // Wrap each method to check at runtime
  const methods = ['list', 'filter', 'get', 'create', 'update', 'delete', 'bulkCreate', 'bulkDelete', 'upsert'];
  
  const entity = {};
  methods.forEach(method => {
    entity[method] = async (...args) => {
      if (useSupabase()) {
        try {
          return await createSupabaseEntity(tableName)[method](...args);
        } catch (error) {
          console.error(`Supabase ${method} error for ${tableName}:`, error);
          // Fallback to localStorage on error
          console.warn('Falling back to localStorage');
          return await localEntity[method](...args);
        }
      }
      return await localEntity[method](...args);
    };
  });
  
  return entity;
};

// ============================================
// Export entities
// ============================================

// Table name mapping (Supabase uses snake_case)
export const Hospital = createEntity('Hospital', 'hospitals');
export const Doctor = createEntity('Doctor', 'doctors');
export const Job = createEntity('Job', 'jobs');
export const Match = createEntity('Match', 'matches');
export const Application = createEntity('Application', 'applications');
export const SeedUrl = createEntity('SeedUrl', 'seed_urls');
export const EmailLog = createEntity('EmailLog', 'email_logs');
export const EmailConfig = createEntity('EmailConfig', 'email_configs');
export const EmailTemplate = createEntity('EmailTemplate', 'email_templates');

// Export storage mode for debugging
export const getStorageMode = () => useSupabase() ? 'supabase' : 'localStorage';
