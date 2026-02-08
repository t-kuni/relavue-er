import type { components } from '../generated/api-types.js';

export type ReverseEngineerResponse = components['schemas']['ReverseEngineerResponse'];
export type ERData = components['schemas']['ERData'];
export type Entity = components['schemas']['Entity'];
export type Column = components['schemas']['Column'];
export type Relationship = components['schemas']['Relationship'];

export type LoadSampleERDiagramDeps = {};

export function createLoadSampleERDiagramUsecase(deps: LoadSampleERDiagramDeps) {
  return async (): Promise<ReverseEngineerResponse> => {
    // init.sqlのerviewerスキーマを参考にサンプルERDataを構築
    const entities: Entity[] = [
      // users table
      {
        id: crypto.randomUUID(),
        name: 'users',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'username', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'email', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'password_hash', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'first_name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'last_name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'avatar_url', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'is_active', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'last_login', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'updated_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
      },
      // user_profiles table
      {
        id: crypto.randomUUID(),
        name: 'user_profiles',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'user_id', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'bio', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'phone', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'website', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'location', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'birth_date', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'privacy_level', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    location VARCHAR(100),
    birth_date DATE,
    privacy_level ENUM('public', 'private', 'friends') DEFAULT 'public',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      },
      // roles table
      {
        id: crypto.randomUUID(),
        name: 'roles',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'description', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'is_active', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);`,
      },
      // user_roles table
      {
        id: crypto.randomUUID(),
        name: 'user_roles',
        columns: [
          { id: crypto.randomUUID(), name: 'user_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'role_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'assigned_at', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'assigned_by', key: 'FOREIGN', isForeignKey: true },
        ],
        ddl: `CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);`,
      },
      // organizations table
      {
        id: crypto.randomUUID(),
        name: 'organizations',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'description', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'website', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'logo_url', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'created_by', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);`,
      },
      // teams table
      {
        id: crypto.randomUUID(),
        name: 'teams',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'organization_id', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'description', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'team_lead_id', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    team_lead_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL
);`,
      },
      // team_members table
      {
        id: crypto.randomUUID(),
        name: 'team_members',
        columns: [
          { id: crypto.randomUUID(), name: 'team_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'user_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'role', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'joined_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE team_members (
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'admin', 'lead') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
      },
      // projects table
      {
        id: crypto.randomUUID(),
        name: 'projects',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'organization_id', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'name', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'description', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'status', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'priority', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'start_date', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'end_date', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'budget', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'created_by', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);`,
      },
      // project_teams table
      {
        id: crypto.randomUUID(),
        name: 'project_teams',
        columns: [
          { id: crypto.randomUUID(), name: 'project_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'team_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'assigned_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE project_teams (
    project_id INT NOT NULL,
    team_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, team_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);`,
      },
      // tasks table
      {
        id: crypto.randomUUID(),
        name: 'tasks',
        columns: [
          { id: crypto.randomUUID(), name: 'id', key: 'PRIMARY', isForeignKey: false },
          { id: crypto.randomUUID(), name: 'project_id', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'title', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'description', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'status', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'priority', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'estimated_hours', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'actual_hours', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'due_date', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'assigned_to', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_by', key: 'FOREIGN', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
          { id: crypto.randomUUID(), name: 'updated_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    due_date DATE,
    assigned_to INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);`,
      },
      // task_dependencies table
      {
        id: crypto.randomUUID(),
        name: 'task_dependencies',
        columns: [
          { id: crypto.randomUUID(), name: 'task_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'depends_on_task_id', key: 'PRIMARY', isForeignKey: true },
          { id: crypto.randomUUID(), name: 'created_at', key: null, isForeignKey: false },
        ],
        ddl: `CREATE TABLE task_dependencies (
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);`,
      },
    ];

    // エンティティのIDとカラムIDをマッピング（リレーションシップ構築用）
    const entityMap = new Map<string, Entity>();
    entities.forEach(entity => {
      entityMap.set(entity.name, entity);
    });

    // 外部キーのリレーションシップを構築
    const relationships: Relationship[] = [];

    // user_profiles.user_id -> users.id
    const userProfiles = entityMap.get('user_profiles')!;
    const users = entityMap.get('users')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: userProfiles.id,
      fromColumnId: userProfiles.columns.find(c => c.name === 'user_id')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'user_profiles_ibfk_1',
    });

    // user_roles.user_id -> users.id
    const userRoles = entityMap.get('user_roles')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: userRoles.id,
      fromColumnId: userRoles.columns.find(c => c.name === 'user_id')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'user_roles_ibfk_1',
    });

    // user_roles.role_id -> roles.id
    const roles = entityMap.get('roles')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: userRoles.id,
      fromColumnId: userRoles.columns.find(c => c.name === 'role_id')!.id,
      toEntityId: roles.id,
      toColumnId: roles.columns.find(c => c.name === 'id')!.id,
      constraintName: 'user_roles_ibfk_2',
    });

    // user_roles.assigned_by -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: userRoles.id,
      fromColumnId: userRoles.columns.find(c => c.name === 'assigned_by')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'user_roles_ibfk_3',
    });

    // organizations.created_by -> users.id
    const organizations = entityMap.get('organizations')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: organizations.id,
      fromColumnId: organizations.columns.find(c => c.name === 'created_by')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'organizations_ibfk_1',
    });

    // teams.organization_id -> organizations.id
    const teams = entityMap.get('teams')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: teams.id,
      fromColumnId: teams.columns.find(c => c.name === 'organization_id')!.id,
      toEntityId: organizations.id,
      toColumnId: organizations.columns.find(c => c.name === 'id')!.id,
      constraintName: 'teams_ibfk_1',
    });

    // teams.team_lead_id -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: teams.id,
      fromColumnId: teams.columns.find(c => c.name === 'team_lead_id')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'teams_ibfk_2',
    });

    // team_members.team_id -> teams.id
    const teamMembers = entityMap.get('team_members')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: teamMembers.id,
      fromColumnId: teamMembers.columns.find(c => c.name === 'team_id')!.id,
      toEntityId: teams.id,
      toColumnId: teams.columns.find(c => c.name === 'id')!.id,
      constraintName: 'team_members_ibfk_1',
    });

    // team_members.user_id -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: teamMembers.id,
      fromColumnId: teamMembers.columns.find(c => c.name === 'user_id')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'team_members_ibfk_2',
    });

    // projects.organization_id -> organizations.id
    const projects = entityMap.get('projects')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: projects.id,
      fromColumnId: projects.columns.find(c => c.name === 'organization_id')!.id,
      toEntityId: organizations.id,
      toColumnId: organizations.columns.find(c => c.name === 'id')!.id,
      constraintName: 'projects_ibfk_1',
    });

    // projects.created_by -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: projects.id,
      fromColumnId: projects.columns.find(c => c.name === 'created_by')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'projects_ibfk_2',
    });

    // project_teams.project_id -> projects.id
    const projectTeams = entityMap.get('project_teams')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: projectTeams.id,
      fromColumnId: projectTeams.columns.find(c => c.name === 'project_id')!.id,
      toEntityId: projects.id,
      toColumnId: projects.columns.find(c => c.name === 'id')!.id,
      constraintName: 'project_teams_ibfk_1',
    });

    // project_teams.team_id -> teams.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: projectTeams.id,
      fromColumnId: projectTeams.columns.find(c => c.name === 'team_id')!.id,
      toEntityId: teams.id,
      toColumnId: teams.columns.find(c => c.name === 'id')!.id,
      constraintName: 'project_teams_ibfk_2',
    });

    // tasks.project_id -> projects.id
    const tasks = entityMap.get('tasks')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: tasks.id,
      fromColumnId: tasks.columns.find(c => c.name === 'project_id')!.id,
      toEntityId: projects.id,
      toColumnId: projects.columns.find(c => c.name === 'id')!.id,
      constraintName: 'tasks_ibfk_1',
    });

    // tasks.assigned_to -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: tasks.id,
      fromColumnId: tasks.columns.find(c => c.name === 'assigned_to')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'tasks_ibfk_2',
    });

    // tasks.created_by -> users.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: tasks.id,
      fromColumnId: tasks.columns.find(c => c.name === 'created_by')!.id,
      toEntityId: users.id,
      toColumnId: users.columns.find(c => c.name === 'id')!.id,
      constraintName: 'tasks_ibfk_3',
    });

    // task_dependencies.task_id -> tasks.id
    const taskDependencies = entityMap.get('task_dependencies')!;
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: taskDependencies.id,
      fromColumnId: taskDependencies.columns.find(c => c.name === 'task_id')!.id,
      toEntityId: tasks.id,
      toColumnId: tasks.columns.find(c => c.name === 'id')!.id,
      constraintName: 'task_dependencies_ibfk_1',
    });

    // task_dependencies.depends_on_task_id -> tasks.id
    relationships.push({
      id: crypto.randomUUID(),
      fromEntityId: taskDependencies.id,
      fromColumnId: taskDependencies.columns.find(c => c.name === 'depends_on_task_id')!.id,
      toEntityId: tasks.id,
      toColumnId: tasks.columns.find(c => c.name === 'id')!.id,
      constraintName: 'task_dependencies_ibfk_2',
    });

    const erData: ERData = {
      source: {
        dialect: 'mysql',
        database: 'erviewer',
      },
      entities,
      relationships,
    };

    // connectionInfoは空のオブジェクト（仕様通り）
    return {
      erData,
      connectionInfo: {} as any,
    };
  };
}
