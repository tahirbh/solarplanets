import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import MatrixCursor from '../components/MatrixCursor';

const Home: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoverText, setHoverText] = useState('Hover over a planet to view information...');

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a20);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 30;
    controls.maxDistance = 400;

    // --- Galaxy stars ---
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 4000;
    const pos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const r = 200 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i+2] = Math.cos(phi) * r;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x88ff88, size: 0.3 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // --- Sun (smaller) ---
    const sunGeo = new THREE.SphereGeometry(8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, emissive: 0xff5500 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    const sunLight = new THREE.PointLight(0xffeedd, 2, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.decay = 0;
    scene.add(sunLight);

    // --- Planets data ---
    const planets: THREE.Mesh[] = [];
    const planetConfigs = [
      { name: 'mercury', size: 1.5, distance: 25, color: '#8c7853', speed: 0.04 },
      { name: 'venus', size: 2.3, distance: 35, color: '#ffc649', speed: 0.03 },
      { name: 'earth', size: 2.5, distance: 50, color: '#4169e1', speed: 0.02 },
      { name: 'mars', size: 2, distance: 65, color: '#cd5c5c', speed: 0.018 },
      { name: 'jupiter', size: 5, distance: 100, color: '#daa520', speed: 0.01 },
      { name: 'saturn', size: 4.5, distance: 140, color: '#f4a460', speed: 0.008 },
      { name: 'uranus', size: 3.5, distance: 180, color: '#4fd0e7', speed: 0.006 },
      { name: 'neptune', size: 3.5, distance: 220, color: '#4169e1', speed: 0.005 }
    ];

    // Helper to create a simple canvas texture (solid color + noise)
    const createPlanetTexture = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.2})`;
        ctx.fillRect(Math.random()*256, Math.random()*256, 20, 20);
      }
      return new THREE.CanvasTexture(canvas);
    };

    planetConfigs.forEach(config => {
      const geo = new THREE.SphereGeometry(config.size, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ map: createPlanetTexture(config.color) });
      const planet = new THREE.Mesh(geo, mat);
      planet.userData = { name: config.name, distance: config.distance, speed: config.speed, angle: Math.random() * Math.PI * 2 };
      scene.add(planet);
      planets.push(planet);

      // Orbit line
      const points = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i/64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * config.distance, 0, Math.sin(a) * config.distance));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x226622, opacity: 0.3, transparent: true });
      const orbit = new THREE.LineLoop(orbitGeo, orbitMat);
      scene.add(orbit);
    });

    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060);
    scene.add(ambient);

    // --- Raycaster for hover ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // --- Animation loop ---
    const animate = () => {
      requestAnimationFrame(animate);

      // Orbit planets
      planets.forEach(p => {
        p.userData.angle += p.userData.speed * 0.01;
        p.position.x = Math.cos(p.userData.angle) * p.userData.distance;
        p.position.z = Math.sin(p.userData.angle) * p.userData.distance;
        p.rotation.y += 0.01;
      });

      // Raycaster for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planets);
      if (intersects.length > 0) {
        const name = intersects[0].object.userData.name;
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        setHoverText(`Selected: ${displayName}`);
      } else {
        setHoverText('Hover over a planet to view information...');
      }

      stars.rotation.y += 0.0001;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div className="matrix-panel" style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <h2>🌌 SOLAR SYSTEM</h2>
        <p>{hoverText}</p>
        <MatrixCursor />
      </div>
    </>
  );
};

export default Home;