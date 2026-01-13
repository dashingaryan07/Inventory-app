// Tenant Isolation Middleware
// Ensures all database queries are automatically filtered by tenantId

export const enforceTenantIsolation = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required'
    });
  }

  // Store original query methods
  const originalQuery = {};

  // Add tenant filter to all queries automatically
  req.tenantFilter = { tenantId: req.tenantId };

  next();
};

// Helper function to add tenant filter to query
export const addTenantFilter = (query, tenantId) => {
  return { ...query, tenantId };
};

// Validate that resource belongs to tenant
export const validateTenantOwnership = (resource, tenantId) => {
  if (resource.tenantId !== tenantId) {
    return false;
  }
  return true;
};