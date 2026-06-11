const { query } = require('../config/database');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password || userData.password_hash; // Support both for compatibility
    this.name = userData.name;
    this.family_name = userData.family_name;
    this.phone = userData.phone;
    this.city = userData.city;
    this.user_type = userData.user_type || 'LEARN_ASKER';
    this.is_active = userData.is_active !== undefined ? userData.is_active : true;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Simple password verification - no hashing
  async verifyPassword(password) {
    return password === this.password;
  }

  // Create new user
  static async create(userData) {
    const { email, password, name, family_name, phone, city, userType } = userData;

    // Store password as plain text (no hashing)
    const result = await query(
      `INSERT INTO users (email, password_hash, name, family_name, phone, city, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [email, password, name, family_name, phone, city, userType]
    );

    return new User(result.rows[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Find all users with pagination and search
  static async findAll(options = {}) {
    const { page = 1, pageSize = 20, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (email ILIKE $' + (params.length + 1) + ' OR name ILIKE $' + (params.length + 1) + ' OR family_name ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'email', 'name', 'family_name', 'user_type', 'is_active', 'created_at', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const result = await query(
      `SELECT * FROM users ${whereClause} 
       ORDER BY ${validSortBy} ${validSortOrder}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const users = result.rows.map(row => new User(row));

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // Update user
  async update(updateData) {
    const allowedFields = ['name', 'family_name', 'phone', 'city', 'user_type', 'is_active'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(this.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Update current instance
    Object.assign(this, result.rows[0]);
    return this;
  }

  // Delete user
  async delete() {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [this.id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return true;
  }

  // Disable user
  async disable() {
    return await this.update({ is_active: false });
  }

  // Enable user
  async enable() {
    return await this.update({ is_active: true });
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Get public user data
  getPublicData() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      family_name: this.family_name,
      phone: this.phone,
      city: this.city,
      userType: this.user_type,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
