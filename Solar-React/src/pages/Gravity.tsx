import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import MatrixCursor from '../components/MatrixCursor';

const Gravity: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a20);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(5, 3, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 30;

    // Stars (galaxy style)
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 4000;
    const pos = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const r = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      const intensity = 0.7 + Math.random() * 0.5;
      colors[i*3] = intensity * 0.8;
      colors[i*3+1] = intensity;
      colors[i*3+2] = intensity * 0.6;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starsMat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const earthGeo = new THREE.SphereGeometry(2, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({ map: earthMap, emissive: 0x112244 });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Moon
    const moonMap = textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg');
    const moonGeo = new THREE.SphereGeometry(0.6, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({ map: moonMap, roughness: 0.8 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moon);

    // Orbit path
    const orbitRadius = 4.8;
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i/128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineDashedMaterial({ color: 0x44ff88, dashSize: 0.2, gapSize: 0.15 });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    orbitLine.computeLineDistances();
    scene.add(orbitLine);

    // Animation
    let moonAngle = 0;
    const speed = 0.5;

    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      requestAnimationFrame(animate);

      earth.rotation.y += 0.001;
      moonAngle += speed * delta;
      moon.position.x = Math.cos(moonAngle) * orbitRadius;
      moon.position.z = Math.sin(moonAngle) * orbitRadius;
      moon.rotation.y += 0.005;

      stars.rotation.y += 0.0001;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Info panel
    const infoDiv = document.createElement('div');
    infoDiv.className = 'matrix-panel';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '20px';
    infoDiv.style.left = '20px';
    infoDiv.innerHTML = `
      <h2>🌍 GRAVITY</h2>
      <div class="data-row"><span>F = G·m₁·m₂ / r²</span></div>
      <div class="data-row"><span>Earth pulls Moon</span></div>
      <div style="margin-top:12px;"><span class="matrix-cursor"></span></div>
    `;
    document.body.appendChild(infoDiv);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      document.body.removeChild(infoDiv);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default Gravity;
