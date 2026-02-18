import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import MatrixCursor from '../components/MatrixCursor';

const SeasonalChange: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a20);

    const camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 6;
    controls.maxDistance = 40;

    // Galaxy stars
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 3000;
    const pos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const r = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i+2] = Math.cos(phi) * r;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x88ff88, size: 0.15 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // Sun at origin (smaller)
    const sunGeo = new THREE.SphereGeometry(1.0, 32, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, emissive: 0xff5500 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    const sunLight = new THREE.PointLight(0xffeedd, 2, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.decay = 0;
    scene.add(sunLight);

    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060);
    scene.add(ambient);

    // Earth group with tilt
    const earthGroup = new THREE.Group();
    earthGroup.rotation.x = 23.5 * Math.PI / 180;
    scene.add(earthGroup);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const earthSpec = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
    const earthNorm = textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const cloudMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');

    const earthMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      specularMap: earthSpec,
      specular: new THREE.Color('grey'),
      shininess: 10,
      normalMap: earthNorm,
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 64), earthMat);
    earthGroup.add(earthMesh);

    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(2.01, 64, 64), cloudMat);
    earthGroup.add(cloudMesh);

    // Orbital path
    const orbitRadius = 7.5;
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i/128) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x226622, opacity: 0.3 });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // State
    let yearAngle = 0; // 0 = spring
    const yearSpeed = 0.0005;
    let dayAngle = 0;
    const daySpeed = 0.01;

    // Matrix info panel
    const infoDiv = document.createElement('div');
    infoDiv.className = 'matrix-panel';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '20px';
    infoDiv.style.right = '20px';
    infoDiv.innerHTML = `
      <h2>🌍 SEASONS</h2>
      <div class="data-row"><span>Current:</span><span id="season-value">SPRING</span></div>
      <div class="data-row"><span>Axial tilt:</span><span>23.5°</span></div>
      <div class="data-row"><span>Orbit progress:</span><span id="orbit-value">0%</span></div>
      <div style="margin-top:12px;"><span class="matrix-cursor"></span></div>
    `;
    document.body.appendChild(infoDiv);

    const getSeason = (angle: number) => {
      const a = ((angle % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
      if (a < Math.PI/2) return 'SPRING';
      if (a < Math.PI) return 'SUMMER';
      if (a < 3*Math.PI/2) return 'AUTUMN';
      return 'WINTER';
    };

    const animate = () => {
      requestAnimationFrame(animate);

      dayAngle += daySpeed;
      yearAngle += yearSpeed;

      // Position Earth on orbit
      const x = Math.cos(yearAngle) * orbitRadius;
      const z = Math.sin(yearAngle) * orbitRadius;
      earthGroup.position.set(x, 0, z);

      earthMesh.rotation.y = dayAngle;
      cloudMesh.rotation.y = dayAngle * 1.01;

      // Update info
      const season = getSeason(yearAngle);
      document.getElementById('season-value')!.textContent = season;
      const progress = ((yearAngle % (2*Math.PI)) / (2*Math.PI) * 100).toFixed(1);
      document.getElementById('orbit-value')!.textContent = progress + '%';

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

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      document.body.removeChild(infoDiv);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default SeasonalChange;