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
// Column name mapping (app uses camelCase, Supabase uses snake_case)
// ============================================
const fieldMapping = {
  // Date fields - app uses _date, Supabase uses _at
  'created_date': 'created_at',
  'updated_date': 'updated_at',
  'createdDate': 'created_at',
  'updatedDate': 'updated_at',
  // Other field mappings
  'appliedAt': 'applied_at',
  'isActive': 'is_active',
  // Fields that don't exist in jobs table - remove them
  'hospitalLogo': null,  // Will be removed
  'status': null,        // Will be removed  
  'portalType': null,    // Will be removed - doesn't exist in jobs table
  'jobHash': null,       // Will be removed - doesn't exist in jobs table
  'portal_type': null,   // Will be removed - doesn't exist in jobs table
  'job_hash': null,      // Will be removed - doesn't exist in jobs table
  'descriptionHtml': 'description_html',
  'description': 'description_html',  // description -> description_html
};

const mapColumnName = (column) => {
  return fieldMapping[column] || column;
};

// Convert camelCase to snake_case
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert object keys from camelCase to snake_case for Supabase
const mapKeysToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const mapped = {};
  for (const [key, value] of Object.entries(obj)) {
    // First check if there's an explicit mapping
    if (key in fieldMapping) {
      const mappedKey = fieldMapping[key];
      // If mapped to null, skip this field (it doesn't exist in DB)
      if (mappedKey !== null) {
        mapped[mappedKey] = value;
      }
      continue;
    }
    // Convert camelCase to snake_case
    const snakeKey = key.includes('_') ? key : toSnakeCase(key);
    mapped[snakeKey] = value;
  }
  return mapped;
};

// ============================================
// Supabase CRUD operations
// ============================================
const createSupabaseEntity = (tableName) => {
  return {
    list: async (orderBy = '-created_at', limit = 10000) => {
      const isDesc = orderBy.startsWith('-');
      const column = mapColumnName(orderBy.replace('-', ''));
      
      // Supabase has a max limit of 1000 per query, so we need to paginate
      if (limit <= 1000) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order(column, { ascending: !isDesc })
          .limit(limit);
        
        if (error) throw error;
        return data || [];
      }
      
      // For limits > 1000, fetch in batches
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      
      while (allData.length < limit) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order(column, { ascending: !isDesc })
          .range(start, start + pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData.push(...data);
        if (data.length < pageSize) break; // No more data
        start += pageSize;
      }
      
      return allData.slice(0, limit); // Respect the requested limit
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
      // Convert camelCase keys to snake_case for Supabase
      const mappedData = mapKeysToSnakeCase(entityData);
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          ...mappedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, updates) => {
      // Convert camelCase keys to snake_case for Supabase
      const mappedUpdates = mapKeysToSnakeCase(updates);
      
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...mappedUpdates,
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
      // Convert camelCase keys to snake_case for Supabase
      const itemsWithTimestamps = items.map(item => ({
        ...mapKeysToSnakeCase(item),
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
      // Convert camelCase keys to snake_case for Supabase
      const itemsWithTimestamps = (Array.isArray(items) ? items : [items]).map(item => ({
        ...mapKeysToSnakeCase(item),
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
  const localEntity = createLocalStorageEntity(entityName);
  
  // Wrap each method to check at runtime
  const methods = ['list', 'filter', 'get', 'create', 'update', 'delete', 'bulkCreate', 'bulkDelete', 'upsert'];
  
  const entity = {};
  methods.forEach(method => {
    entity[method] = async (...args) => {
      if (useSupabase()) {
        // Use Supabase only - no localStorage fallback
        return await createSupabaseEntity(tableName)[method](...args);
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
