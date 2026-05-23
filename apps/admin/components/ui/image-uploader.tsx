'use client'
import React, { useState, useRef } from 'react'
import { apiClient } from '../../lib/api-client'

export async function uploadImage(file: File, folder?: string): Promise<string> {
	const form = new FormData()
	form.append('file', file)
	if (folder) form.append('folder', folder)
	const { data } = await apiClient.post<{ url?: string; error?: string }>('/v1/assets/upload', form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	})
	if (!data.url) throw new Error(data.error ?? 'Upload failed')
	return data.url
}

export async function deleteImage(url: string): Promise<void> {
	try {
		await apiClient.delete('/v1/assets/delete', { params: { url } })
	} catch {
		// Silently fail — orphaned images are acceptable
	}
}

const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const UPLOAD_MAX_MB = 5

export function ImageUploader({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder?: string }) {
	const [uploading, setUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [dragOver, setDragOver] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	async function handleFile(file: File) {
		if (!file.type.startsWith('image/')) { setUploadError('File must be an image (JPEG, PNG, WebP, GIF)'); return }
		if (file.size > UPLOAD_MAX_MB * 1024 * 1024) { setUploadError(`Image must be under ${UPLOAD_MAX_MB} MB`); return }
		setUploading(true); setUploadError(null)
		try {
			onChange(await uploadImage(file, folder))
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.'
			setUploadError(msg)
		} finally {
			setUploading(false)
		}
	}

	function onInput(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (file) handleFile(file)
		e.target.value = ''
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault(); setDragOver(false)
		const file = e.dataTransfer.files[0]
		if (file) handleFile(file)
	}

	if (value) {
		return (
			<div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--bf-line)' }}>
				<img
					src={value} alt='Uploaded image'
					style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
					onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
				/>
				<div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
					<button
						onClick={() => !uploading && inputRef.current?.click()}
						disabled={uploading}
						style={{ background: 'rgba(35,31,32,.72)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: 8, cursor: uploading ? 'default' : 'pointer', padding: '5px 11px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
					>
						<svg width={12} height={12} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>
						{uploading ? 'Uploading…' : 'Replace'}
					</button>
					<button
						onClick={() => { deleteImage(value); onChange('') }}
						style={{ background: 'rgba(35,31,32,.72)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '5px 10px', fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}
						title='Remove image'
					>×</button>
				</div>
				{uploading && (
					<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
						<div style={{ position: 'absolute', top: 0, height: '100%', width: '50%', background: 'var(--bf-ember)', borderRadius: 999, animation: 'bf-upload-slide 1s ease-in-out infinite' }} />
					</div>
				)}
				<input ref={inputRef} type='file' accept={UPLOAD_ACCEPT} style={{ display: 'none' }} onChange={onInput} />
			</div>
		)
	}

	return (
		<div>
			<div
				onDragOver={e => { e.preventDefault(); setDragOver(true) }}
				onDragLeave={() => setDragOver(false)}
				onDrop={onDrop}
				onClick={() => !uploading && inputRef.current?.click()}
				style={{
					border: `2px dashed ${dragOver ? 'var(--bf-ember)' : uploadError ? 'var(--bf-ember)' : 'var(--bf-line-2)'}`,
					borderRadius: 14, padding: '30px 20px', textAlign: 'center',
					cursor: uploading ? 'default' : 'pointer',
					background: dragOver ? 'rgba(232,67,31,.04)' : 'var(--bf-cream-2)',
					transition: 'border-color .15s, background .15s',
					position: 'relative', overflow: 'hidden',
				}}
			>
				{uploading ? (
					<>
						<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bf-ink-2)', marginBottom: 10 }}>Uploading image…</div>
						<div style={{ height: 4, background: 'var(--bf-line)', borderRadius: 999, overflow: 'hidden', maxWidth: 160, margin: '0 auto' }}>
							<div style={{ position: 'relative', height: '100%', width: '50%', background: 'var(--bf-ember)', borderRadius: 999, animation: 'bf-upload-slide 1s ease-in-out infinite' }} />
						</div>
					</>
				) : (
					<>
						<div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
							<div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bf-paper)', border: '1px solid var(--bf-line)', display: 'grid', placeItems: 'center', color: 'var(--bf-mute)' }}>
								<svg width={20} height={20} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>
							</div>
						</div>
						<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bf-ink-2)', marginBottom: 3 }}>
							{dragOver ? 'Drop image here' : 'Click or drag image to upload'}
						</div>
						<div style={{ fontSize: 11, color: 'var(--bf-mute)' }}>JPEG, PNG, WebP, GIF · max {UPLOAD_MAX_MB} MB</div>
					</>
				)}
			</div>
			{uploadError && (
				<div style={{ marginTop: 6, fontSize: 12, color: 'var(--bf-ember)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
					<span>⚠</span> {uploadError}
				</div>
			)}
			<input ref={inputRef} type='file' accept={UPLOAD_ACCEPT} style={{ display: 'none' }} onChange={onInput} />
		</div>
	)
}
