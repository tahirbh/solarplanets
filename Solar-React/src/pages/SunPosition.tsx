import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import MatrixCursor from '../components/MatrixCursor';

const SunPosition: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a20);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 60;

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 3500;
    const pos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const r = 90 + Math.random() * 60;
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

    // Sun group (off-center)
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-6, 2, 0);
    scene.add(sunGroup);

    const sunGeo = new THREE.SphereGeometry(1.0, 64, 32); // smaller
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xff5500 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    const sunLight = new THREE.PointLight(0xffeedd, 2.5, 0, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.decay = 0;
    sunGroup.add(sunLight);

    // Ambient
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
      blending: THREE.AdditiveBlending
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(2.01, 64, 64), cloudMat);
    earthGroup.add(cloudMesh);

    // Makkah marker
    const makkahLat = 21.4225 * Math.PI/180;
    const makkahLon = 39.826 * Math.PI/180;
    const r = 2;
    const mkX = r * Math.cos(makkahLat) * Math.cos(makkahLon);
    const mkY = r * Math.sin(makkahLat);
    const mkZ = r * Math.cos(makkahLat) * Math.sin(makkahLon);
    const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(mkX, mkY, mkZ);
    earthGroup.add(marker);

    // Orbital path
    const orbitRadius = 8.5;
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i/128) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x226622, opacity: 0.3 });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // Time state (synced to real)
    let pausedDayAngle = 0;
    let pausedYearAngle = 0;

    const updateFromRealTime = () => {
      const date = new Date();
      const makkahHours = (date.getUTCHours() + 3) % 24;
      const makkahMinutes = date.getUTCMinutes();
      const makkahSeconds = date.getUTCSeconds();
      const totalSecs = makkahHours * 3600 + makkahMinutes * 60 + makkahSeconds;
      pausedDayAngle = (totalSecs / (24*3600)) * 2 * Math.PI;

      const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((date.getTime() - start.getTime()) / (24*3600*1000));
      const equinoxDay = 79;
      const dayOffset = (dayOfYear - equinoxDay + 365) % 365;
      pausedYearAngle = (dayOffset / 365.25) * 2 * Math.PI;
    };
    updateFromRealTime();

    // Matrix info panel
    const infoDiv = document.createElement('div');
    infoDiv.className = 'matrix-panel';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '120px';
    infoDiv.style.left = '20px';
    infoDiv.style.transition = 'opacity 0.3s';
    infoDiv.innerHTML = `
      <h2>☀️ SUN POSITION</h2>
      <div class="data-row"><span>Makkah angle to Sun:</span><span id="makkah-angle">0.0°</span></div>
      <div class="data-row"><span>Distance from Sun:</span><span id="distance">0 M km</span></div>
      <div class="data-row"><span>Orbit progress:</span><span id="orbit-progress">0%</span></div>
      <div class="data-row"><span>Makkah day/night:</span><span id="daynight">DAY</span></div>
      <div style="margin-top:12px;"><span class="matrix-cursor"></span></div>
    `;
    document.body.appendChild(infoDiv);

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '📟 TOGGLE INFO';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.top = '20px';
    toggleBtn.style.left = '20px';
    toggleBtn.style.zIndex = '300';
    toggleBtn.style.background = 'black';
    toggleBtn.style.color = '#0f0';
    toggleBtn.style.border = '2px solid #0f0';
    toggleBtn.style.padding = '8px 16px';
    toggleBtn.style.borderRadius = '30px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontFamily = 'Courier New';
    toggleBtn.onclick = () => {
      panelVisible = !panelVisible;
      infoDiv.style.opacity = panelVisible ? '1' : '0';
    };
    document.body.appendChild(toggleBtn);

    let panelVisible = true;

    const computeMakkahAngle = () => {
      const earthPos = earthGroup.position;
      const sunPos = sunGroup.position;
      const toSun = new THREE.Vector3().subVectors(sunPos, earthPos).normalize();
      const markerWorld = marker.clone();
      markerWorld.applyMatrix4(earthGroup.matrixWorld);
      const normal = new THREE.Vector3().subVectors(markerWorld.position, earthPos).normalize();
      const dot = normal.dot(toSun);
      return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
    };

    const animate = () => {
      requestAnimationFrame(animate);

      // Update from real time (if not paused)
      updateFromRealTime();

      // Position Earth
      const x = Math.cos(pausedYearAngle) * orbitRadius;
      const z = Math.sin(pausedYearAngle) * orbitRadius;
      earthGroup.position.set(sunGroup.position.x + x, 0, sunGroup.position.z + z);

      earthMesh.rotation.y = pausedDayAngle;
      cloudMesh.rotation.y = pausedDayAngle * 1.01;

      // Update info
      const angle = computeMakkahAngle();
      document.getElementById('makkah-angle')!.textContent = angle.toFixed(2) + '°';
      const dist = earthGroup.position.distanceTo(sunGroup.position) * 17.65;
      document.getElementById('distance')!.textContent = dist.toFixed(1) + ' M km';
      const progress = ((pausedYearAngle % (2*Math.PI)) / (2*Math.PI) * 100).toFixed(1);
      document.getElementById('orbit-progress')!.textContent = progress + '%';
      const daynight = angle > 90 ? 'NIGHT' : 'DAY';
      document.getElementById('daynight')!.textContent = daynight;

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
      document.body.removeChild(toggleBtn);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default SunPosition;