// Local storage based mock client for development without Base44

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to get data from localStorage
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Helper to set data in localStorage
const setStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Create a mock entity with CRUD operations
const createMockEntity = (entityName) => {
  const storageKey = `med_match_${entityName.toLowerCase()}`;
  
  return {
    list: async () => {
      return getStorageData(storageKey);
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
    }
  };
};

// Mock auth
const mockAuth = {
  isAuthenticated: async () => true,
  me: async () => ({
    id: 'local-user',
    email: 'user@localhost',
    name: 'Local User'
  }),
  login: (redirectPath) => {
    console.log('Mock login - redirect to:', redirectPath);
  },
  logout: () => {
    console.log('Mock logout');
  }
};

// Mock integrations
const mockIntegrations = {
  Core: {
    InvokeLLM: async ({ prompt, response_json_schema }) => {
      console.log('Mock InvokeLLM called with prompt:', prompt?.substring(0, 100));
      // Return a mock response
      if (response_json_schema) {
        return { result: 'Mock LLM response', data: {} };
      }
      return 'Mock LLM response - This is a placeholder. Connect to a real LLM API for actual responses.';
    },
    SendEmail: async ({ to, subject, body }) => {
      console.log('Mock SendEmail:', { to, subject });
      return { success: true, message: 'Email logged (mock)' };
    },
    UploadFile: async ({ file }) => {
      console.log('Mock UploadFile:', file?.name);
      // Create a local URL for the file
      const url = URL.createObjectURL(file);
      return { url, file_name: file?.name };
    },
    GenerateImage: async ({ prompt }) => {
      console.log('Mock GenerateImage:', prompt);
      return { url: 'https://via.placeholder.com/512x512?text=Mock+Image' };
    },
    ExtractDataFromUploadedFile: async ({ file_url }) => {
      console.log('Mock ExtractDataFromUploadedFile:', file_url);
      return { data: {} };
    },
    CreateFileSignedUrl: async ({ file_name }) => {
      console.log('Mock CreateFileSignedUrl:', file_name);
      return { signed_url: '#', file_url: '#' };
    },
    UploadPrivateFile: async ({ file }) => {
      console.log('Mock UploadPrivateFile:', file?.name);
      const url = URL.createObjectURL(file);
      return { url, file_name: file?.name };
    }
  }
};

// Create the mock client
export const base44 = {
  entities: {
    Doctor: createMockEntity('Doctor'),
    Job: createMockEntity('Job'),
    SeedUrl: createMockEntity('SeedUrl'),
    Match: createMockEntity('Match'),
    EmailLog: createMockEntity('EmailLog'),
    Hospital: createMockEntity('Hospital'),
    Application: createMockEntity('Application'),
    EmailConfig: createMockEntity('EmailConfig'),
    EmailTemplate: createMockEntity('EmailTemplate')
  },
  auth: mockAuth,
  integrations: mockIntegrations
};

export default base44;
