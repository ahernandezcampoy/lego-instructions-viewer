import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

function isPinValid(req) {
  const configuredPin = process.env.ADMIN_PIN
  if (!configuredPin) return false
  const providedPin = String(req.headers['x-admin-pin'] || '')
  return providedPin.length > 0 && providedPin === configuredPin
}

export default async function handler(req, res) {
  if (!process.env.ADMIN_PIN) {
    return res.status(500).json({ error: 'ADMIN_PIN no está configurado en el servidor.' })
  }

  if (!isPinValid(req)) {
    return res.status(401).json({ error: 'PIN incorrecto o no autorizado.' })
  }

  // Comprobación rápida al desbloquear el candado
  if (req.method === 'POST' && req.query.action === 'verify') {
    return res.status(200).json({ ok: true })
  }

  try {
    const supabase = getAdminSupabase()

    // CREAR SET
    if (req.method === 'POST') {
      const { set_number, name, image_url, manuals } = req.body || {}

      if (!set_number?.trim() || !name?.trim()) {
        return res.status(400).json({ error: 'El número y el nombre del set son obligatorios.' })
      }

      const { data, error } = await supabase
        .from('lego_sets')
        .insert({
          set_number: set_number.trim(),
          name: name.trim(),
          image_url: image_url?.trim() || null,
          manuals: Array.isArray(manuals) ? manuals : [],
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json(data)
    }

    // ACTUALIZAR SET, ESTADO MONTADO O PROGRESO DE PÁGINA
    if (req.method === 'PATCH') {
      const { id, ...fields } = req.body || {}
      if (!id) {
        return res.status(400).json({ error: 'Falta el id del set.' })
      }

      const allowedUpdates = {}
      if (typeof fields.set_number === 'string') allowedUpdates.set_number = fields.set_number.trim()
      if (typeof fields.name === 'string') allowedUpdates.name = fields.name.trim()
      if ('image_url' in fields) allowedUpdates.image_url = fields.image_url?.trim() || null
      if (Array.isArray(fields.manuals)) allowedUpdates.manuals = fields.manuals
      if (typeof fields.is_built === 'boolean') allowedUpdates.is_built = fields.is_built
      if ('built_at' in fields) allowedUpdates.built_at = fields.built_at
      if (Number.isInteger(fields.last_manual_index) && fields.last_manual_index >= 0) {
        allowedUpdates.last_manual_index = fields.last_manual_index
      }
      if (Number.isInteger(fields.last_page) && fields.last_page >= 1) {
        allowedUpdates.last_page = fields.last_page
      }

      const { data, error } = await supabase
        .from('lego_sets')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return res.status(200).json(data)
    }

    // ELIMINAR SET
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id
      if (!id) {
        return res.status(400).json({ error: 'Falta el id del set a eliminar.' })
      }

      const { error } = await supabase.from('lego_sets').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ deleted: true, id })
    }

    res.setHeader('Allow', 'POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch (err) {
    console.error('[api/sets] Error:', err)
    return res.status(500).json({ error: err.message || 'Error interno al guardar en Supabase.' })
  }
}