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

	const [lightbox, setLightbox] = useState(false)
	const [hovered, setHovered] = useState(false)

	if (value) {
		return (
			<>
				<div style={{ borderRadius: 14, border: '1px solid var(--bf-line)', overflow: 'hidden', background: 'var(--bf-cream-2)' }}>
					{/* Image area */}
					<div
						style={{ position: 'relative', cursor: 'zoom-in' }}
						onClick={() => setLightbox(true)}
						onMouseEnter={() => setHovered(true)}
						onMouseLeave={() => setHovered(false)}
					>
						<img
							src={value} alt='Uploaded image'
							style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', transition: 'filter .2s', filter: hovered ? 'brightness(.88)' : 'none' }}
							onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
						/>
						{/* Hover overlay — eye icon */}
						<div style={{
							position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
							opacity: hovered ? 1 : 0, transition: 'opacity .2s', pointerEvents: 'none',
						}}>
							<div style={{ background: 'rgba(35,31,32,.65)', backdropFilter: 'blur(6px)', borderRadius: 10, padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 12, fontWeight: 700 }}>
								<svg width={14} height={14} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.2} strokeLinecap='round' strokeLinejoin='round'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>
								Preview
							</div>
						</div>
						{/* Upload progress bar */}
						{uploading && (
							<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
								<div style={{ position: 'absolute', top: 0, height: '100%', width: '50%', background: 'var(--bf-ember)', borderRadius: 999, animation: 'bf-upload-slide 1s ease-in-out infinite' }} />
							</div>
						)}
					</div>

					{/* Action row below image */}
					<div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--bf-line)' }}>
						<button
							onClick={() => !uploading && inputRef.current?.click()}
							disabled={uploading}
							style={{ flex: 1, background: 'var(--bf-paper)', border: '1px solid var(--bf-line)', borderRadius: 8, cursor: uploading ? 'default' : 'pointer', padding: '7px 12px', fontSize: 12, fontWeight: 700, color: 'var(--bf-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
						>
							<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' y1='3' x2='12' y2='15'/></svg>
							{uploading ? 'Uploading…' : 'Replace image'}
						</button>
						<button
							onClick={() => { deleteImage(value); onChange('') }}
							style={{ background: 'transparent', border: '1px solid var(--bf-line)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontSize: 12, fontWeight: 700, color: 'var(--bf-ember)', display: 'flex', alignItems: 'center', gap: 5 }}
							title='Remove image'
						>
							<svg width={13} height={13} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/><path d='M10 11v6'/><path d='M14 11v6'/></svg>
							Remove
						</button>
					</div>
				</div>

				{/* Lightbox */}
				{lightbox && (
					<div
						onClick={() => setLightbox(false)}
						style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
					>
						<img
							src={value} alt='Product image preview'
							style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}
							onClick={e => e.stopPropagation()}
						/>
						<button
							onClick={() => setLightbox(false)}
							style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 10, cursor: 'pointer', width: 38, height: 38, display: 'grid', placeItems: 'center', color: '#fff' }}
						>
							<svg width={18} height={18} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>
						</button>
					</div>
				)}

				<input ref={inputRef} type='file' accept={UPLOAD_ACCEPT} style={{ display: 'none' }} onChange={onInput} />
			</>
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
