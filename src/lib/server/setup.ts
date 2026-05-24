import { Client } from 'pg'
import { exec } from 'child_process'
import { promisify } from 'util'
import { ServerError } from '$lib/utils/errors'
import bcrypt from 'bcrypt'
import { NotificationCode } from '$lib/utils/notifications'
import { generateRandomPin } from './pin'
import path from 'path'

const execAsync = promisify(exec)

export const envPath: string = path.resolve(process.cwd(), 'env', '.env')

export const defaultPgURL: string = process.env.DATABASE_URL ?? ''

export const defaultEnvHeader: string = ''

export const devWarning: string = ''

export async function changeDatabasePassword(
  newPassword: string
): Promise<void> {
  console.log('\n---------- CHANGING DATABASE PASSWORD ----------\n')

  resetProcessEnv()

  newPassword = newPassword.replace(/["\/\\\+&#%\?=:@]/g, '')

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  try {
    // Railway maneja usuarios automáticamente
    // No cambiar password manualmente
  } catch (err) {
    console.error('Error changing database password:', err)

    await client.end()

    throw new ServerError(
      'Failed to change database password',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Database password changed successfully.')
}

export async function initDatabase(): Promise<void> {
  console.log('\n------------ INITIALIZING DATABASE -------------\n')

  resetProcessEnv()

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  try {
    await execAsync('npx prisma db push')
  } catch (err) {
    console.error('Error pushing prisma schema:', err)

    await client.end()

    throw new ServerError(
      'Database initialization failed',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  try {
    const res = await client.query(
      `SELECT 1 FROM "Environment" WHERE id = $1`,
      [1]
    )

    if (res.rowCount === 0) {
      await client.query(
        `INSERT INTO "Environment"
        ("id", "language", "name", "theme", "updatedAt")
        VALUES ($1, 'en', 'EML', 'default', NOW())`,
        [1]
      )
    } else {
      await client.query(
        `UPDATE "Environment"
         SET "updatedAt" = NOW()
         WHERE "id" = $1`,
        [1]
      )
    }
  } catch (err) {
    console.error('Error initializing Environment table:', err)

    await client.end()

    throw new ServerError(
      'Failed to initialize Environment table',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Database initialized successfully.')
}

export async function setAdminUser(
  username: string,
  password: string
): Promise<void> {
  console.log('\n------------- CREATING ADMIN USER --------------\n')

  resetProcessEnv()

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await client.query(
      `INSERT INTO "User"
      ("id", "username", "password", "status", "isAdmin",
      "p_filesUpdater", "p_bootstraps", "p_maintenance",
      "p_news", "p_newsCategories", "p_newsTags",
      "p_backgrounds", "p_stats", "createdAt", "updatedAt")
      VALUES
      (1, $1, $2, 'ACTIVE', true,
      2, 1, 1,
      2, 1, 1,
      1, 2, NOW(), NOW())
      ON CONFLICT DO NOTHING`,
      [username, hashedPassword]
    )

    await client.query(
      `UPDATE "Environment"
       SET "name" = $1, "updatedAt" = NOW()
       WHERE "id" = $2`,
      [username, 1]
    )
  } catch (err) {
    console.error('Error initializing admin user:', err)

    await client.end()

    throw new ServerError(
      'Failed to initialize admin user',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Admin user created successfully.')
}

export async function setPin(): Promise<void> {
  console.log('\n----------------- SETTING PIN ------------------\n')

  resetProcessEnv()

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  const pin = generateRandomPin()

  try {
    await client.query(
      `UPDATE "Environment"
       SET "pin" = $1
       WHERE "id" = $2`,
      [pin, 1]
    )
  } catch (err) {
    console.error('Error setting pin:', err)

    await client.end()

    throw new ServerError(
      'Failed to set pin',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Pin set successfully.')
}

export async function setLanguage(language: string): Promise<void> {
  console.log('\n--------------- SETTING LANGUAGE ---------------\n')

  resetProcessEnv()

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  try {
    await client.query(
      `UPDATE "Environment"
       SET "language" = $1
       WHERE "id" = $2`,
      [language, 1]
    )
  } catch (err) {
    console.error('Error setting language:', err)

    await client.end()

    throw new ServerError(
      'Failed to set language',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Language set successfully.')
}

export async function setDefaultProfile(name: string): Promise<void> {
  console.log('\n------------ SETTING DEFAULT PROFILE ------------\n')

  resetProcessEnv()

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')

  try {
    await client.query(
      `INSERT INTO "Profile"
      ("id", "name", "isDefault", "slug", "createdAt", "updatedAt")
      VALUES ($1, $2, true, $3, NOW(), NOW())
      ON CONFLICT DO NOTHING`,
      ['1', name, slug]
    )
  } catch (err) {
    console.error('Error setting default profile:', err)

    await client.end()

    throw new ServerError(
      'Failed to set default profile',
      err,
      NotificationCode.DATABASE_ERROR,
      500
    )
  }

  await client.end()

  console.log('Default profile set successfully.')
}

export async function markAsConfigured(): Promise<void> {
  console.log('\n----------- CONFIGURATION COMPLETED ------------\n')
  return
}

export function resetProcessEnv(): void {
  // Railway ya inyecta variables automáticamente
}

export async function restartUpdater(): Promise<void> {
  console.log('\n-------------- RESTARTING UPDATER --------------\n')
  return
}

export async function restartServer(): Promise<void> {
  console.log('Restarting server...')
  return
}

function updateEnv(): void {
  return
}