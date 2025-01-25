import * as THREE from 'three'
import { BufferGeometry, Mesh, MeshStandardMaterial } from 'three'
import { CSG } from 'three-csg-ts'

interface ShapeParameters {
    width?: number
    height?: number
    depth?: number
    radius?: number
    segments?: number
}

interface Operation {
    type: 'boolean' | 'fillet' | 'chamfer'
    operation: 'union' | 'difference' | 'intersection' | 'edge'
    parameters: Record<string, number>
}

interface Material {
    color: string
    metalness: number
    roughness: number
}

interface Shape {
    type: 'primitive' | 'extrusion' | 'revolution'
    shape: 'cube' | 'cylinder' | 'sphere' | 'cone'
    parameters: ShapeParameters
    position: [number, number, number]
    rotation: [number, number, number]
    operations: Operation[]
    material: Material
}

export async function generateMesh(shape: Shape): Promise<{
    vertices: number[]
    indices: number[]
    normals: number[]
    uvs: number[]
}> {
    let geometry: BufferGeometry
    
    // Create base geometry based on shape type
    switch (shape.shape) {
        case 'cube':
            geometry = new THREE.BoxGeometry(
                shape.parameters.width || 1,
                shape.parameters.height || 1,
                shape.parameters.depth || 1
            )
            break
            
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(
                shape.parameters.radius || 0.5,
                shape.parameters.radius || 0.5,
                shape.parameters.height || 1,
                shape.parameters.segments || 32
            )
            break
            
        case 'sphere':
            geometry = new THREE.SphereGeometry(
                shape.parameters.radius || 0.5,
                shape.parameters.segments || 32,
                shape.parameters.segments || 32
            )
            break
            
        case 'cone':
            geometry = new THREE.ConeGeometry(
                shape.parameters.radius || 0.5,
                shape.parameters.height || 1,
                shape.parameters.segments || 32
            )
            break
            
        default:
            throw new Error(`Unsupported shape type: ${shape.shape}`)
    }
    
    // Create mesh with material
    const material = new MeshStandardMaterial({
        color: shape.material.color,
        metalness: shape.material.metalness,
        roughness: shape.material.roughness
    })
    let mesh = new Mesh(geometry, material)
    
    // Apply position and rotation
    mesh.position.set(...shape.position)
    mesh.rotation.set(...shape.rotation)
    
    // Apply operations
    for (const operation of shape.operations) {
        switch (operation.type) {
            case 'boolean':
                // Create second mesh for boolean operation
                const secondGeometry = new THREE.BoxGeometry(1, 1, 1) // Example
                const secondMesh = new Mesh(secondGeometry, material.clone())
                
                let resultMesh: Mesh<BufferGeometry, MeshStandardMaterial>
                switch (operation.operation) {
                    case 'union':
                        resultMesh = CSG.union(mesh, secondMesh) as Mesh<BufferGeometry, MeshStandardMaterial>
                        break
                    case 'difference':
                        resultMesh = CSG.subtract(mesh, secondMesh) as Mesh<BufferGeometry, MeshStandardMaterial>
                        break
                    case 'intersection':
                        resultMesh = CSG.intersect(mesh, secondMesh) as Mesh<BufferGeometry, MeshStandardMaterial>
                        break
                    default:
                        continue
                }
                
                // Ensure the result mesh uses the original material
                resultMesh.material = material
                mesh = resultMesh
                break
                
            case 'fillet':
                // TODO: Implement fillet operation
                break
                
            case 'chamfer':
                // TODO: Implement chamfer operation
                break
        }
    }
    
    // Extract mesh data
    const vertices = Array.from(mesh.geometry.attributes.position.array)
    const indices = Array.from(mesh.geometry.index?.array || [])
    const normals = Array.from(mesh.geometry.attributes.normal.array)
    const uvs = Array.from(mesh.geometry.attributes.uv.array)
    
    return {
        vertices,
        indices,
        normals,
        uvs
    }
} 