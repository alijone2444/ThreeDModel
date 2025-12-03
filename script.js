// Scene setup
const scene = new THREE.Scene();
// Background will be set by HDR image
scene.background = new THREE.Color(0xf0f0f0);

// Camera setup
const container = document.getElementById('canvas-container');
// Use window dimensions for fullscreen
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    1000
);

// Renderer setup with enhanced realism
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
});
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for realism
renderer.shadowMap.autoUpdate = true;
// Enhanced tone mapping for photorealistic rendering
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // Slightly increased for better brightness
// Ensure proper color output encoding
if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
}
// Enable physically correct lighting
renderer.physicallyCorrectLights = true;
container.appendChild(renderer.domElement);

// OrbitControls setup
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.enablePan = true;

// Enhanced realistic lighting setup
// Main sun light (warm daylight)
const directionalLight1 = new THREE.DirectionalLight(0xfff4e6, 2.5); // Warm sunlight
directionalLight1.position.set(10, 15, 5);
directionalLight1.castShadow = true;
directionalLight1.shadow.mapSize.width = 4096; // Higher resolution shadows
directionalLight1.shadow.mapSize.height = 4096;
directionalLight1.shadow.camera.near = 0.5;
directionalLight1.shadow.camera.far = 100;
directionalLight1.shadow.camera.left = -20;
directionalLight1.shadow.camera.right = 20;
directionalLight1.shadow.camera.top = 20;
directionalLight1.shadow.camera.bottom = -20;
directionalLight1.shadow.bias = -0.0001; // Reduce shadow acne
directionalLight1.shadow.normalBias = 0.02;
directionalLight1.shadow.radius = 8; // Soft shadow edges
scene.add(directionalLight1);

// Fill light (cooler, softer)
const directionalLight2 = new THREE.DirectionalLight(0xb8d4ff, 1.2); // Cool fill light
directionalLight2.position.set(-10, 8, -8);
directionalLight2.castShadow = false; // Fill lights don't need shadows
scene.add(directionalLight2);

// Rim light for depth
const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight3.position.set(-5, 5, -15);
scene.add(directionalLight3);

// Hemisphere light for natural sky/ground lighting
const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.6); // Sky blue to ground brown
hemisphereLight.position.set(0, 20, 0);
scene.add(hemisphereLight);

// Subtle ambient light (very low to maintain contrast)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

// UI sliders for lighting and view controls
const hdrIntensitySlider = document.getElementById('hdrIntensitySlider');
const sunIntensitySlider = document.getElementById('sunIntensitySlider');
const ambientIntensitySlider = document.getElementById('ambientIntensitySlider');
const reflectionIntensitySlider = document.getElementById('reflectionIntensitySlider');

const hdrIntensityValue = document.getElementById('hdrIntensityValue');
const sunIntensityValue = document.getElementById('sunIntensityValue');
const ambientIntensityValue = document.getElementById('ambientIntensityValue');
const reflectionIntensityValue = document.getElementById('reflectionIntensityValue');

let reflectionIntensity = 1.0;

function updateReflectionIntensity() {
    if (!model) return;
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
                if (mat && mat.envMapIntensity !== undefined) {
                    mat.envMapIntensity = reflectionIntensity;
                    mat.needsUpdate = true;
                }
            });
        }
    });
}

function setupUIControls() {
    if (hdrIntensitySlider && hdrIntensityValue) {
        hdrIntensitySlider.value = renderer.toneMappingExposure.toString();
        hdrIntensityValue.textContent = renderer.toneMappingExposure.toFixed(2);
        hdrIntensitySlider.addEventListener('input', () => {
            const v = parseFloat(hdrIntensitySlider.value);
            renderer.toneMappingExposure = v;
            hdrIntensityValue.textContent = v.toFixed(2);
        });
    }

    if (sunIntensitySlider && sunIntensityValue) {
        sunIntensitySlider.value = directionalLight1.intensity.toString();
        sunIntensityValue.textContent = directionalLight1.intensity.toFixed(2);
        sunIntensitySlider.addEventListener('input', () => {
            const v = parseFloat(sunIntensitySlider.value);
            directionalLight1.intensity = v;
            sunIntensityValue.textContent = v.toFixed(2);
        });
    }

    if (ambientIntensitySlider && ambientIntensityValue) {
        ambientIntensitySlider.value = ambientLight.intensity.toString();
        ambientIntensityValue.textContent = ambientLight.intensity.toFixed(2);
        ambientIntensitySlider.addEventListener('input', () => {
            const v = parseFloat(ambientIntensitySlider.value);
            ambientLight.intensity = v;
            ambientIntensityValue.textContent = v.toFixed(2);
        });
    }

    if (reflectionIntensitySlider && reflectionIntensityValue) {
        reflectionIntensitySlider.value = reflectionIntensity.toString();
        reflectionIntensityValue.textContent = reflectionIntensity.toFixed(2);
        reflectionIntensitySlider.addEventListener('input', () => {
            reflectionIntensity = parseFloat(reflectionIntensitySlider.value);
            reflectionIntensityValue.textContent = reflectionIntensity.toFixed(2);
            updateReflectionIntensity();
        });
    }
}

setupUIControls();

// Load HDR background
const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load(
    'hdr2.hdr',
    function (texture) {
        // Set HDR as background
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;

        // Use HDR for environment lighting (IBL) - crucial for realistic materials
        scene.environment = texture;

        // Enhance environment map intensity for better material response
        // This will be applied to materials via envMapIntensity property

        console.log('HDR background loaded successfully!');
    },
    function (xhr) {
        // Some servers/CDNs don't provide total size, which makes xhr.total === 0
        if (xhr.total > 0) {
            const percent = (xhr.loaded / xhr.total) * 100;
            console.log('HDR loading progress:', Math.round(percent) + '%');
        } else {
            console.log('HDR loading progress: loading... (total size unknown)');
        }
    },
    function (error) {
        console.error('Error loading HDR background:', error);
        // Keep default background color if HDR fails to load
        scene.background = new THREE.Color(0xf0f0f0);
    }
);

// Load GLB model with proper texture handling
const loader = new THREE.GLTFLoader();

// Configure DRACOLoader for Draco-compressed models
const dracoLoader = new THREE.DRACOLoader();
// Set the path to the Draco decoder files
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
// Attach the DRACOLoader to the GLTFLoader
loader.setDRACOLoader(dracoLoader);

// Configure loader to handle textures properly
loader.setPath(''); // Set path if textures are in a subdirectory

// Texture loading manager for better texture handling
const textureLoader = new THREE.TextureLoader();
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {
    console.log('All textures loaded');
};
loadingManager.onError = function (url) {
    console.error('Error loading texture:', url);
};

let model = null;
let mixer = null; // AnimationMixer for GLB animations
let animations = []; // Store animations from GLB file
let isAnimating = false; // Track if animation is playing
let animationFinished = false; // Track if animation has completed
const clock = new THREE.Clock(); // Clock for animation timing

// Mesh dragging variables
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedMesh = null;
let isDragging = false;
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();
let hoveredMesh = null;
const originalMaterials = new Map(); // Store original materials for highlighting

// Camera rotation animation variables
let defaultCameraPosition = new THREE.Vector3();
let defaultCameraTarget = new THREE.Vector3();
let isCameraRotating = false;
let cameraRotationProgress = 0;
let cameraRotationDuration = 7000; // 10 seconds for full rotation
let cameraRotationStartTime = 0;
let rotationCompleted = false; // Track if rotation has completed
let name = 'compressed.glb'
console.log('##############################', name, '#################################')
loader.load(
    name,
    function (gltf) {
        model = gltf.scene;

        // Log all meshes and materials for debugging
        console.log('=== Model Loaded - Analyzing Materials ===');
        let meshCount = 0;
        let materialCount = 0;

        // Enable shadows and fix materials for proper lighting
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Log mesh name for debugging (especially for grass)
                meshCount++;
                const meshName = child.name.toLowerCase();
                const isGrass = meshName.includes('grass') || meshName.includes('ground') || meshName.includes('lawn') ||
                    meshName.includes('terrain') || meshName.includes('plane') || meshName.includes('floor');
                const isWood = meshName.includes('wood') || meshName.includes('bamboo') || meshName.includes('log') ||
                    meshName.includes('tree') || meshName.includes('branch');
                const isMetal = meshName.includes('metal') || meshName.includes('steel') || meshName.includes('iron') ||
                    meshName.includes('aluminum') || meshName.includes('chrome');
                const isGlass = meshName.includes('glass') || meshName.includes('window') || meshName.includes('transparent');
                const isFabric = meshName.includes('fabric') || meshName.includes('cloth') || meshName.includes('curtain') ||
                    meshName.includes('textile');

                // Log all meshes for debugging
                if (isGrass || child.name) {
                    console.log(`Mesh ${meshCount}: ${child.name || 'unnamed'}`, {
                        type: child.type,
                        visible: child.visible,
                        materialType: child.material ? (Array.isArray(child.material) ? 'array' : child.material.type) : 'none'
                    });
                }

                // Ensure materials respond to lighting properly
                if (child.material) {
                    // Handle both single materials and arrays
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((mat, index) => {
                        if (mat) {
                            materialCount++;

                            // Debug logging for grass materials
                            if (isGrass) {
                                console.log('=== GRASS MATERIAL DETECTED ===');
                                console.log('Mesh name:', child.name);
                                console.log('Material type:', mat.type);
                                console.log('Has map texture:', !!mat.map);
                                if (mat.map) {
                                    console.log('Map texture info:', {
                                        width: mat.map.image ? mat.map.image.width : 'N/A',
                                        height: mat.map.image ? mat.map.image.height : 'N/A',
                                        loaded: mat.map.image ? mat.map.image.complete : false,
                                        encoding: mat.map.encoding
                                    });
                                }
                                console.log('Material color (RGB):', mat.color ? {
                                    r: mat.color.r.toFixed(3),
                                    g: mat.color.g.toFixed(3),
                                    b: mat.color.b.toFixed(3)
                                } : 'N/A');
                                console.log('Material properties:', {
                                    transparent: mat.transparent,
                                    opacity: mat.opacity,
                                    side: mat.side,
                                    roughness: mat.roughness,
                                    metalness: mat.metalness,
                                    visible: mat.visible
                                });
                            }

                            // Only reset emissive if it's too bright (don't remove intentional emissive)
                            if (mat.emissive && mat.emissive.getHex() === 0xffffff) {
                                mat.emissive.setHex(0x000000);
                            }

                            // Convert BasicMaterial to PhysicalMaterial for realistic PBR rendering
                            if (mat.type === 'MeshBasicMaterial' || (mat.type && mat.type.includes('Basic'))) {
                                // Preserve all properties when converting to PhysicalMaterial
                                const newMat = new THREE.MeshPhysicalMaterial();

                                // Copy all texture maps
                                if (mat.map) {
                                    newMat.map = mat.map;
                                    newMat.map.encoding = THREE.sRGBEncoding;
                                    newMat.map.flipY = mat.map.flipY !== undefined ? mat.map.flipY : true;
                                }
                                if (mat.alphaMap) {
                                    newMat.alphaMap = mat.alphaMap;
                                    newMat.alphaMap.encoding = THREE.sRGBEncoding;
                                }
                                if (mat.normalMap) {
                                    newMat.normalMap = mat.normalMap;
                                    if (mat.normalScale) newMat.normalScale.copy(mat.normalScale);
                                }
                                if (mat.roughnessMap) newMat.roughnessMap = mat.roughnessMap;
                                if (mat.metalnessMap) newMat.metalnessMap = mat.metalnessMap;
                                if (mat.aoMap) newMat.aoMap = mat.aoMap;
                                if (mat.emissiveMap) newMat.emissiveMap = mat.emissiveMap;

                                // Copy material properties with realistic defaults
                                if (mat.color) newMat.color.copy(mat.color);
                                if (mat.opacity !== undefined) newMat.opacity = mat.opacity;
                                if (mat.transparent !== undefined) newMat.transparent = mat.transparent;

                                // Realistic PBR properties based on material type
                                if (mat.roughness !== undefined) newMat.roughness = mat.roughness;
                                else {
                                    // Smart roughness based on material type
                                    if (isGrass) newMat.roughness = 0.95; // Grass is very rough
                                    else if (isWood) newMat.roughness = 0.8; // Wood has moderate roughness
                                    else if (isMetal) newMat.roughness = 0.2; // Metal is smooth
                                    else if (isGlass) newMat.roughness = 0.05; // Glass is very smooth
                                    else if (isFabric) newMat.roughness = 0.9; // Fabric is rough
                                    else newMat.roughness = 0.7; // Default for most materials
                                }

                                if (mat.metalness !== undefined) newMat.metalness = mat.metalness;
                                else {
                                    // Smart metalness based on material type
                                    if (isMetal) newMat.metalness = 0.9; // Metal is highly metallic
                                    else if (isWood) newMat.metalness = 0.0; // Wood is not metallic
                                    else if (isGrass) newMat.metalness = 0.0; // Grass is not metallic
                                    else newMat.metalness = 0.0; // Default metalness
                                }

                                // Enhanced physical material properties for realism
                                if (isGlass) {
                                    newMat.clearcoat = 1.0; // Glass has full clearcoat
                                    newMat.clearcoatRoughness = 0.0; // Glass is perfectly smooth
                                    newMat.transmission = 0.95; // Glass transmits light
                                    newMat.opacity = 0.1; // Glass is mostly transparent
                                    newMat.transparent = true;
                                } else if (isWood) {
                                    newMat.clearcoat = 0.3; // Wood can have slight sheen
                                    newMat.clearcoatRoughness = 0.3;
                                } else if (isMetal) {
                                    newMat.clearcoat = 0.5; // Metal can have protective coating
                                    newMat.clearcoatRoughness = 0.1;
                                } else {
                                    newMat.clearcoat = 0.0;
                                    newMat.clearcoatRoughness = 0.1;
                                }

                                // Sheen for fabric-like materials
                                if (isFabric) {
                                    newMat.sheen = 0.3; // Fabric has sheen
                                    newMat.sheenRoughness = 0.8;
                                } else {
                                    newMat.sheen = 0.0;
                                    newMat.sheenRoughness = 0.0;
                                }

                                // Improve material response to environment
                                newMat.envMapIntensity = isMetal ? 1.5 : (isGlass ? 2.0 : 1.0); // Metals and glass reflect more

                                // Preserve side property (important for grass/leaves)
                                if (mat.side !== undefined) newMat.side = mat.side;
                                else newMat.side = THREE.DoubleSide; // Default to double-sided for better visibility

                                // Preserve alphaTest for cutout materials
                                if (mat.alphaTest !== undefined) newMat.alphaTest = mat.alphaTest;

                                // For grass, ensure it's visible and properly configured
                                if (isGrass) {
                                    newMat.side = THREE.DoubleSide;
                                    if (!newMat.map && newMat.color) {
                                        // If no texture, ensure color is preserved
                                        console.log('Grass material color preserved:', newMat.color);
                                    }
                                }

                                // Replace the material
                                if (Array.isArray(child.material)) {
                                    child.material[index] = newMat;
                                } else {
                                    child.material = newMat;
                                }
                                mat = newMat; // Update reference for further processing
                            } else {
                                // Upgrade StandardMaterial to PhysicalMaterial for better realism
                                if (mat.type === 'MeshStandardMaterial') {
                                    const physicalMat = new THREE.MeshPhysicalMaterial();

                                    // Copy all existing properties
                                    if (mat.map) physicalMat.map = mat.map;
                                    if (mat.normalMap) physicalMat.normalMap = mat.normalMap;
                                    if (mat.roughnessMap) physicalMat.roughnessMap = mat.roughnessMap;
                                    if (mat.metalnessMap) physicalMat.metalnessMap = mat.metalnessMap;
                                    if (mat.aoMap) physicalMat.aoMap = mat.aoMap;
                                    if (mat.emissiveMap) physicalMat.emissiveMap = mat.emissiveMap;
                                    if (mat.alphaMap) physicalMat.alphaMap = mat.alphaMap;

                                    if (mat.color) physicalMat.color.copy(mat.color);
                                    if (mat.opacity !== undefined) physicalMat.opacity = mat.opacity;
                                    if (mat.transparent !== undefined) physicalMat.transparent = mat.transparent;
                                    if (mat.roughness !== undefined) physicalMat.roughness = mat.roughness;
                                    if (mat.metalness !== undefined) physicalMat.metalness = mat.metalness;
                                    if (mat.side !== undefined) physicalMat.side = mat.side;
                                    if (mat.alphaTest !== undefined) physicalMat.alphaTest = mat.alphaTest;

                                    // Add realistic physical properties
                                    physicalMat.clearcoat = 0.0;
                                    physicalMat.clearcoatRoughness = 0.1;
                                    physicalMat.envMapIntensity = 1.0;

                                    // Replace material
                                    if (Array.isArray(child.material)) {
                                        child.material[index] = physicalMat;
                                    } else {
                                        child.material = physicalMat;
                                    }
                                    mat = physicalMat; // Update reference
                                }

                                // Ensure textures have proper encoding
                                if (mat.map) {
                                    mat.map.encoding = THREE.sRGBEncoding;
                                    mat.map.needsUpdate = true;
                                }

                                // Enhance existing PhysicalMaterial properties
                                if (mat.type === 'MeshPhysicalMaterial') {
                                    if (mat.envMapIntensity === undefined) {
                                        // Set envMapIntensity based on material type
                                        if (isMetal) mat.envMapIntensity = 1.5;
                                        else if (isGlass) mat.envMapIntensity = 2.0;
                                        else mat.envMapIntensity = 1.0;
                                    }
                                    // Ensure realistic clearcoat for glossy surfaces
                                    if (mat.clearcoat === undefined) {
                                        if (isGlass) mat.clearcoat = 1.0;
                                        else if (isWood) mat.clearcoat = 0.3;
                                        else if (isMetal) mat.clearcoat = 0.5;
                                        else mat.clearcoat = 0.0;
                                    }
                                    // Add transmission for glass
                                    if (isGlass && mat.transmission === undefined) {
                                        mat.transmission = 0.95;
                                        mat.opacity = 0.1;
                                        mat.transparent = true;
                                    }
                                    // Add sheen for fabric
                                    if (isFabric && mat.sheen === undefined) {
                                        mat.sheen = 0.3;
                                        mat.sheenRoughness = 0.8;
                                    }
                                }

                                // Apply material-specific roughness and metalness if not set
                                if (mat.roughness === undefined || mat.roughness === 0) {
                                    if (isGrass) mat.roughness = 0.95;
                                    else if (isWood) mat.roughness = 0.8;
                                    else if (isMetal) mat.roughness = 0.2;
                                    else if (isGlass) mat.roughness = 0.05;
                                    else if (isFabric) mat.roughness = 0.9;
                                    else if (mat.roughness === undefined) mat.roughness = 0.7;
                                }

                                if (mat.metalness === undefined || (mat.metalness === 0 && isMetal)) {
                                    if (isMetal) mat.metalness = 0.9;
                                    else if (mat.metalness === undefined) mat.metalness = 0.0;
                                }

                                // For grass materials, ensure double-sided
                                if (isGrass) {
                                    mat.side = THREE.DoubleSide;
                                    // Ensure grass material is not too dark
                                    if (mat.color && mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) {
                                        // If color is too dark, it might be a lighting issue
                                        console.log('Grass material appears dark, checking lighting...');
                                    }
                                }

                                // For transparent/alpha materials, ensure double-sided
                                if (mat.side === undefined || mat.side === THREE.FrontSide) {
                                    if (mat.transparent || mat.alphaMap || (mat.opacity !== undefined && mat.opacity < 1)) {
                                        mat.side = THREE.DoubleSide;
                                    }
                                }
                            }

                            // Set proper encoding for all textures and ensure they're loaded
                            if (mat.map) {
                                mat.map.encoding = THREE.sRGBEncoding;
                                // Improve texture filtering for better quality
                                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.map.magFilter = THREE.LinearFilter;
                                mat.map.generateMipmaps = true;
                                mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Maximum anisotropy for sharp textures
                                // Force texture update
                                if (mat.map.image) {
                                    if (mat.map.image.complete) {
                                        mat.map.needsUpdate = true;
                                    } else {
                                        // Wait for texture to load
                                        mat.map.image.onload = function () {
                                            mat.map.needsUpdate = true;
                                            if (isGrass) {
                                                console.log('Grass texture loaded successfully');
                                            }
                                        };
                                    }
                                }
                                mat.map.needsUpdate = true;
                            }

                            // Enhance normal maps for better surface detail
                            if (mat.normalMap) {
                                mat.normalMap.encoding = THREE.LinearEncoding; // Normal maps should be linear
                                mat.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
                                mat.normalMap.magFilter = THREE.LinearFilter;
                                mat.normalMap.generateMipmaps = true;
                                mat.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                                // Increase normal map intensity for more visible detail
                                if (mat.normalScale === undefined || mat.normalScale.x === 1) {
                                    mat.normalScale = new THREE.Vector2(1.5, 1.5); // More pronounced normal mapping
                                }
                                mat.normalMap.needsUpdate = true;
                            }
                            if (mat.alphaMap) {
                                mat.alphaMap.encoding = THREE.sRGBEncoding;
                                mat.alphaMap.needsUpdate = true;
                            }
                            if (mat.normalMap) {
                                mat.normalMap.needsUpdate = true;
                            }
                            if (mat.roughnessMap) {
                                mat.roughnessMap.needsUpdate = true;
                            }
                            if (mat.metalnessMap) {
                                mat.metalnessMap.needsUpdate = true;
                            }

                            // For grass, ensure it's not too dark - boost color if needed
                            if (isGrass && mat.color) {
                                // If grass color is too dark (likely a lighting/material issue)
                                const avgColor = (mat.color.r + mat.color.g + mat.color.b) / 3;
                                if (avgColor < 0.2 && !mat.map) {
                                    // Boost green channel for grass if no texture
                                    console.log('Boosting grass color - was too dark');
                                    mat.color.g = Math.max(mat.color.g, 0.3);
                                    mat.color.r = Math.max(mat.color.r, 0.2);
                                    mat.color.b = Math.max(mat.color.b, 0.2);
                                }
                            }

                            // Ensure material is visible and properly lit
                            mat.visible = true;

                            // Enable proper lighting response
                            mat.needsUpdate = true;

                            // Force render update
                            if (isGrass) {
                                console.log('Final grass material state:', {
                                    hasTexture: !!mat.map,
                                    color: mat.color ? { r: mat.color.r, g: mat.color.g, b: mat.color.b } : null,
                                    visible: mat.visible,
                                    type: mat.type
                                });
                            }
                        }
                    });
                }

                // Ensure mesh is visible
                child.visible = true;
            }
        });

        scene.add(model);

        // Store animations from GLB file (don't play yet)
        if (gltf.animations && gltf.animations.length > 0) {
            animations = gltf.animations;
            mixer = new THREE.AnimationMixer(model);
            console.log('Animations found:', gltf.animations.length);
            gltf.animations.forEach((clip) => {
                console.log('  -', clip.name);
            });

            // Enable the animation button
            const btn = document.getElementById('playAnimationBtn');
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        } else {
            console.log('No animation found');
            const btn = document.getElementById('playAnimationBtn');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        }

        // Calculate bounding box to center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model at origin
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Adjust camera position based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.15; // Reduced from 1.5 to get closer

        // Lower the camera (reduce Y) and make it closer (reduce Z)
        camera.position.set(0, maxDim * 0, cameraZ * 0.85); // Lower Y from 0.5 to 0.3, closer Z by 0.85
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.update();

        // Store default camera position and target
        defaultCameraPosition.copy(camera.position);
        defaultCameraTarget.copy(controls.target);

        console.log(`Model loaded successfully! Total meshes: ${meshCount}, Total materials processed: ${materialCount}`);
        console.log('=== Material Analysis Complete ===');

        // Hide loader when model is loaded
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },
    function (xhr) {
        // Avoid dividing by zero when total size is not known (common in production/CDN)
        if (xhr.total > 0) {
            const percentLoaded = (xhr.loaded / xhr.total * 100);
            console.log(Math.round(percentLoaded) + '% loaded');

            // Update loader progress if needed
            const loader = document.getElementById('loader');
            if (loader) {
                const loaderText = loader.querySelector('p');
                if (loaderText) {
                    loaderText.textContent = `Loading 3D Model... ${Math.round(percentLoaded)}%`;
                }
            }
        } else {
            console.log('Model loading... (total size unknown)');
        }
    },
    function (error) {
        console.error('Error loading model:', error);
        container.innerHTML = '<p style="color: red; text-align: center; padding: 50px;">Error loading 3D model. Please check if the model file exists.</p>';

        // Hide loader on error
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
);

// Handle window resize
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);

// Function to start animations (auto-play after rotation)
function startAnimation(autoPlay = false) {
    if (!mixer || animations.length === 0) {
        console.log('No animation found');
        return;
    }

    // Start animation - play once and stop at last frame
    animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce); // Play only once
        action.clampWhenFinished = true; // Stop at last frame
        action.play();
    });
    isAnimating = true;

    // Hide animation button after it starts (whether auto-played or manually clicked)
    const btn = document.getElementById('playAnimationBtn');
    if (btn) {
        btn.style.display = 'none';
    }
    console.log('Animation started');
}

// Combined function: rotation + animation
function startRotationAndAnimation() {
    if (!model) {
        console.log('Model not loaded yet');
        return;
    }

    // Check if animations are available
    if (!mixer || animations.length === 0) {
        console.log('No animation found, starting rotation only');
        // Start rotation directly without animation
        if (defaultCameraPosition.lengthSq() === 0) {
            defaultCameraPosition.copy(camera.position);
            defaultCameraTarget.copy(controls.target);
        }
        isCameraRotating = true;
        cameraRotationStartTime = Date.now();
        cameraRotationProgress = 0;
        controls.enabled = false;
        rotationCompleted = false;
        const btn = document.getElementById('playAnimationBtn');
        if (btn) {
            btn.style.display = 'none';
        }
        return;
    }

    // Ensure default position is set
    if (defaultCameraPosition.lengthSq() === 0) {
        defaultCameraPosition.copy(camera.position);
        defaultCameraTarget.copy(controls.target);
    }

    // Hide animation button immediately
    const btn = document.getElementById('playAnimationBtn');
    if (btn) {
        btn.style.display = 'none';
    }

    // Start rotation first
    isCameraRotating = true;
    cameraRotationStartTime = Date.now();
    cameraRotationProgress = 0;
    controls.enabled = false; // Disable manual controls during rotation
    rotationCompleted = false;

    console.log('Starting rotation, then animation...');
}

// Function to start camera rotation animation (kept for backward compatibility, but not used)
function startCameraRotation() {
    // This function is kept but rotation is now handled by startRotationAndAnimation
    startRotationAndAnimation();
}

// Easing function for smooth animation (ease in-out)
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Function to highlight a mesh
function highlightMesh(mesh, highlight = true) {
    if (!mesh || !mesh.isMesh) return;

    if (highlight) {
        // Store original material if not already stored
        if (!originalMaterials.has(mesh)) {
            originalMaterials.set(mesh, mesh.material);
        }

        // Create highlight material
        const highlightMaterial = mesh.material.clone();
        if (highlightMaterial.emissive) {
            highlightMaterial.emissive.setHex(0x444444); // Subtle glow
        } else {
            highlightMaterial.emissive = new THREE.Color(0x444444);
        }
        highlightMaterial.emissiveIntensity = 0.3;
        mesh.material = highlightMaterial;
    } else {
        // Restore original material
        if (originalMaterials.has(mesh)) {
            mesh.material = originalMaterials.get(mesh);
        }
    }
}

// Function to get mouse position in normalized device coordinates
function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Handle dragging
    if (isDragging && selectedMesh) {
        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Find intersection with drag plane
        const intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectionPoint);

        if (intersectionPoint) {
            // Move mesh to new position (subtract offset to maintain relative position)
            selectedMesh.position.copy(intersectionPoint.sub(dragOffset));

            // Update mesh matrix
            selectedMesh.updateMatrixWorld(true);
        }
        return;
    }

    // Only allow interaction after animation finishes
    if (!animationFinished || isCameraRotating || isAnimating) {
        // Remove hover highlight if animation is running
        if (hoveredMesh) {
            highlightMesh(hoveredMesh, false);
            hoveredMesh = null;
            renderer.domElement.style.cursor = 'default';
        }
        return;
    }

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Find intersected objects (only if model is loaded)
    if (!model) return;
    const intersects = raycaster.intersectObjects(model.children, true);

    // Handle hover highlighting
    // Remove previous hover
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
        highlightMesh(hoveredMesh, false);
    }

    // Add new hover
    if (intersects.length > 0 && intersects[0].object.isMesh) {
        const mesh = intersects[0].object;
        if (mesh !== hoveredMesh && mesh !== selectedMesh) {
            hoveredMesh = mesh;
            highlightMesh(mesh, true);
            renderer.domElement.style.cursor = 'pointer';
        }
    } else {
        hoveredMesh = null;
        renderer.domElement.style.cursor = 'default';
    }
}

// Function to handle mouse down (start dragging)
function onMouseDown(event) {
    // Only allow interaction after animation finishes
    if (!animationFinished || isCameraRotating || isAnimating) {
        return;
    }

    // Disable OrbitControls when clicking on a mesh
    controls.enabled = false;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Find intersected objects (only if model is loaded)
    if (!model) return;
    const intersects = raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0 && intersects[0].object.isMesh) {
        selectedMesh = intersects[0].object;
        isDragging = true;

        // Calculate drag plane (perpendicular to camera view)
        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal);
        dragPlane.setFromNormalAndCoplanarPoint(normal, selectedMesh.position);

        // Calculate offset from mesh center to intersection point
        const intersectionPoint = intersects[0].point;
        dragOffset.copy(intersectionPoint).sub(selectedMesh.position);

        // Highlight selected mesh
        highlightMesh(selectedMesh, true);

        // Prevent default to avoid conflicts
        event.preventDefault();
    }
}

// Function to handle mouse up (stop dragging)
function onMouseUp(event) {
    if (isDragging) {
        isDragging = false;

        // Re-enable OrbitControls
        controls.enabled = true;

        // Keep highlight on selected mesh
        if (selectedMesh) {
            console.log('Mesh moved:', selectedMesh.name || 'unnamed', 'to position:', selectedMesh.position);
        }
    }
}

// Add event listeners for mesh dragging
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mouseleave', onMouseUp); // Stop dragging if mouse leaves canvas

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update animation mixer if it exists and animation is playing
    if (mixer && isAnimating) {
        const delta = clock.getDelta();
        mixer.update(delta);

        // Check if animation has finished (stopped at last frame)
        let allFinished = true;
        animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            if (action && action.isRunning()) {
                allFinished = false;
            }
        });

        // If animation finished, keep it at last frame (clampWhenFinished handles this)
        if (allFinished && isAnimating) {
            // Animation is at last frame, keep it there
            isAnimating = false; // Mark as not actively animating but keep at last frame
            animationFinished = true; // Enable mesh dragging
            console.log('Animation finished - mesh dragging enabled');
        }
    }

    // Handle camera rotation animation - smooth 360 degree rotation
    if (isCameraRotating) {
        const elapsed = Date.now() - cameraRotationStartTime;
        cameraRotationProgress = Math.min(elapsed / cameraRotationDuration, 1);

        // Use easing for smooth acceleration and deceleration
        const easedProgress = easeInOutCubic(cameraRotationProgress);

        // Calculate rotation angle (0 to 2π for full 360°)
        const angle = easedProgress * Math.PI * 2;

        // Calculate camera position in a circle around the model
        // Get the horizontal distance (radius) from origin
        const horizontalDistance = Math.sqrt(
            defaultCameraPosition.x * defaultCameraPosition.x +
            defaultCameraPosition.z * defaultCameraPosition.z
        );
        const height = defaultCameraPosition.y;

        // Get the initial angle to maintain the starting position
        const initialAngle = Math.atan2(defaultCameraPosition.x, defaultCameraPosition.z);

        // Calculate new camera position (rotate around Y-axis)
        const newX = Math.sin(angle + initialAngle) * horizontalDistance;
        const newZ = Math.cos(angle + initialAngle) * horizontalDistance;
        camera.position.set(newX, height, newZ);

        // Always look at the center
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);

        // If rotation is complete, smoothly end and start animation
        if (cameraRotationProgress >= 1) {
            isCameraRotating = false;
            rotationCompleted = true;

            // Camera is already at final position from smooth rotation (no need to set again)
            // This ensures no jerk - the eased rotation naturally completes at the start position

            // Auto-start animation after rotation completes
            setTimeout(() => {
                startAnimation(true); // Auto-play animation
            }, 100); // Small delay for smooth transition
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Make functions globally accessible
window.startAnimation = startAnimation;
window.startCameraRotation = startCameraRotation;
window.startRotationAndAnimation = startRotationAndAnimation;



