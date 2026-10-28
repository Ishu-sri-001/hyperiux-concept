# HYPERIUX — IMMERSIVE 3D WEBSITE
## Complete Creative Direction, Interaction Design & Implementation Brief

You are building a completely new, immersive, fully 3D website experience for **Hyperiux**, a creative digital agency.

I will provide a reference concept image showing the visual direction and approximate section composition. Use it as inspiration for the art direction, glass materials, particle behavior, spatial layouts, typography, and overall atmosphere. Do not reproduce it literally.

Your task is to turn this visual concept into a real, polished, production-quality website with working interactions, a continuous 3D world, sophisticated scroll choreography, and meaningful agency content.

This is NOT my personal portfolio. Do not introduce dragons, Japanese fantasy environments, shrines, or any personal portfolio narrative.

The website is for the Hyperiux agency. Its product, Hyperiux Vault, is a separate developer-focused effects library that should be showcased as one part of the agency website.

---

# 1. EXISTING WEBSITES — UNDERSTAND THE BRAND FIRST

Before implementing anything, inspect both existing websites:

- Agency website: https://www.hyperiux.com/
- Product website: https://vault.hyperiux.com/

Understand the existing brand, agency positioning, actual services, existing projects, content, navigation, and Vault product before changing anything.

Preserve accurate business information. Do not invent clients, testimonials, project results, services, or product features. Reuse existing assets and copy when appropriate, improving presentation without changing factual meaning.

The new agency website should feel like a significant creative evolution of Hyperiux, not an unrelated brand.

## Core creative idea

**HYPERIUX — IDEAS TAKE SHAPE.**

The entire experience is built around a recognizable capital letter **H**, constructed from translucent glass geometry, fine particle structures, luminous filaments, and suspended microscopic spheres.

The H is the website's central visual identity. It is not an occasional logo pasted onto the screen. It is a living 3D object that drives the entire experience.

It can:
- Assemble itself from particles during the opening.
- Rotate and reveal its glass structure.
- React to the user's cursor.
- Deform, fragment, and reform as the user scrolls.
- Separate into components representing different agency services.
- Generate the architecture of the project gallery.
- Form a geometric process diagram.
- Become a crystalline structure in the Vault section.
- Reassemble into a complete H at the end of the journey.

The shape must remain recognizable as a capital H throughout its transformations.

The final result should feel like entering a physical space made from digital matter.

---

# 2. CREATIVE DIRECTION AND ART STYLE

## Color palette

Use a light, sophisticated, architectural aesthetic.

Primary colors:
- Warm ivory: #F5F2EC
- Soft porcelain: #EAE6DE
- Pale stone: #D9D3C9
- Transparent, cool glass with subtle blue-grey reflections
- Liquid silver: #B9BEC5
- Champagne gold: #D8AA70
- Charcoal typography: #20201E
- Deep graphite for contrast: #292A2C

Gold is an accent, not the dominant color. Most of the scene should use neutral glass, soft daylight, silver reflections, and warm white illumination.

Avoid making the website uniformly orange or gold.

## Materials

The H should look like a physically plausible combination of:

1. Clear optical glass.
2. Slightly frosted glass at selected edges.
3. Thin metallic or luminous filaments suspended inside the glass.
4. Tiny particles that appear trapped within and orbiting around the structure.
5. Subtle champagne-colored light traveling along selected paths.

Use realistic Fresnel reflections, refraction, controlled roughness, transmission, internal highlights, and depth.

Avoid the appearance of cheap transparent plastic, excessive bloom, exaggerated chrome, or a glowing wireframe with no physical depth.

The glass must retain visible edges against the bright background. Use careful environmental reflections and darker edge reflections to preserve contrast.

## Environment

Create a minimal, monumental architectural space.

Think:
- Sculptural ivory walls.
- Large curved openings and arches.
- Reflective pale stone floors.
- Tall vertical spaces.
- Soft skylight and physically motivated shadows.
- Floating glass fragments and particles.
- Atmospheric depth without excessive fog.
- Subtle architectural reflections.

The environment should be original and abstract, not a recognizable existing building or generic science-fiction corridor.

The architecture exists to frame the H and guide the camera, not to compete with it.

## Typography

Use refined editorial typography:
- Oversized, lightweight headlines.
- A clean, contemporary sans-serif.
- Carefully spaced uppercase labels.
- Small, restrained monospace metadata where appropriate.
- Strong negative space.
- Minimal UI borders and restrained navigation.

Avoid excessive text, oversized gradients, generic pill-shaped cards, and decorative interface elements that serve no purpose.

---

# 3. GLOBAL WEBSITE ARCHITECTURE

The website should feel like one continuous experience rather than a collection of unrelated pages stacked vertically.

Build one persistent primary 3D scene and choreograph it through the page using scroll position.

The camera should move through the world while the H transforms. Architectural elements, particles, lighting, and content enter and leave the composition in a coordinated sequence.

The reference image contains nine visual sections. Treat these as nine stages in one cinematic journey, not nine static panels.

## Persistent interface

Keep a minimal navigation interface available throughout the experience.

Top-left:
HYPERIUX wordmark.

Top-right:
- Work
- Services
- Vault
- About
- Contact

Include a restrained menu control for smaller screens.

The navigation should be HTML/UI layered over the 3D canvas, not text permanently embedded in the 3D scene.

When hovering a navigation item:
- Show a subtle animated underline or particle trace.
- Slightly adjust the H's motion or camera composition if appropriate.
- Do not cause a dramatic scene transition merely from hovering.

When clicked:
- Navigate to the corresponding section using a smooth, coordinated transition.
- Update the active navigation state.
- Support browser history and keyboard navigation where appropriate.

Include a discreet scroll progress indicator. It should communicate progress through the experience without dominating the design.

---

# 4. SECTION 01 — LOADING / GENESIS

## Purpose

Create a short, memorable introduction that establishes the H as the visual identity of Hyperiux.

## Initial state

The screen opens with a warm ivory background and a nearly empty environment.

A single small glass particle appears at the center.

Additional particles begin to emerge from the surrounding space. They should have varied sizes, subtle transparency, realistic highlights, and slightly different trajectories.

They travel along carefully designed paths and gradually assemble into the structural silhouette of a capital H.

The two vertical pillars form first. Then the connecting horizontal bar develops through a stream of particles and glass filaments.

The final structure should resemble an engineered glass sculpture rather than a cloud that happens to resemble a letter.

## Animation sequence

1. One particle appears.
2. A few particles orbit it.
3. A larger field of particles emerges.
4. The particles converge into the H's vertical pillars.
5. Fine filaments form the horizontal bridge.
6. Transparent glass surfaces gradually develop.
7. Light travels through the completed H.
8. The camera slowly approaches the finished sculpture.
9. The hero scene is revealed.

Display a minimal HYPERIUX wordmark and a subtle loading indicator.

The loading percentage must reflect actual asset-loading progress if shown. Do not use a fabricated progress counter.

## Interaction

If the pointer moves during loading, nearby particles can deviate slightly from their paths, but the assembly must remain controlled.

Respect reduced-motion preferences. Provide a shorter assembly or static completed H when appropriate.

## Important implementation requirement

Do not delay the entire website while loading a huge 3D scene. Prioritize essential assets and show a usable fallback immediately. The full experience should begin when the required scene assets are ready.

---

# 5. SECTION 02 — HERO / THE CORE

## Layout

This is the main visual statement of the agency.

Use a large, open architectural space with a monumental glass H floating near the center-right of the viewport.

On the left, display:

WE SHAPE
DIGITAL
EXPERIENCES.

Supporting copy:

A creative digital agency building immersive, interactive, and unforgettable digital experiences.

Primary CTA:
EXPLORE OUR WORK

The text should remain clean, readable HTML. Do not turn every text element into a 3D object.

At the top, display the navigation.

Near the bottom, include a subtle scroll indicator.

## 3D composition

The H should occupy approximately 40–55% of the visual composition, depending on viewport size.

It should have:
- A clear capital H silhouette.
- Translucent glass surfaces.
- Reflections from the environment.
- Fine internal particle structures.
- A small number of bright champagne highlights.
- A soft, physically grounded reflection on the floor.

Use depth and parallax to make the object feel genuinely three-dimensional.

The camera should be slightly off-axis rather than perfectly frontal. The viewer should be able to perceive the thickness and depth of the letter.

## Idle behavior

The H should not be completely motionless, but it should not constantly spin.

Use:
- Very slow rotation.
- A subtle breathing motion.
- Small particles orbiting selected areas.
- Occasional light traveling through the internal filaments.
- Extremely restrained movement of suspended fragments.

The effect should feel expensive and deliberate.

## Cursor interaction

The H should respond to pointer movement with a slight rotational offset.

Particles near the cursor can bend away or attract toward it, depending on their location.

The response should be smooth, with inertia. The object should not snap directly to the pointer.

The architecture and background can exhibit very subtle parallax.

Do not distort the letter so much that it loses its recognizable shape.

## Hero scroll transition

As the user scrolls:
1. The camera begins to move around the H.
2. The H shifts toward the center.
3. The particle structure becomes more visible.
4. Selected glass components detach.
5. The particles extend outward into the next scene.
6. The hero typography transitions out.

The next section must emerge from the same particle structure. Do not abruptly replace the entire scene.

---

# 6. SECTION 03 — INTERACTION / A LIVING H

This stage demonstrates the physical behavior of the H itself.

The scene can become closer and more abstract, allowing the user to inspect the glass, particles, filaments, and refractions.

Introduce a minimal interaction legend that explains available controls without covering the sculpture.

## Interaction states

### State A — Idle

The H remains intact.

Particles orbit along a few defined paths, with small variations in velocity and scale.

### State B — Cursor attraction

Particles near the pointer are pulled gently toward it, creating a temporary deformation in the surrounding particle field.

The glass structure itself should remain mostly stable.

### State C — Cursor repulsion

On a stronger pointer movement, particles can move away from the cursor, creating a localized wave.

The wave travels through the particle field and fades naturally.

### State D — Scroll deformation

As the scroll position changes, the H's internal filaments stretch and selected particles move into new formations.

The main letter gradually separates into components in preparation for the Services section.

### State E — Click interaction

Clicking the H triggers a restrained radial pulse of light and particles.

The pulse should travel outward through the particle field, then dissipate.

It must not interrupt scrolling, cause layout shifts, or trap the user in an animation.

## Input rules

- Use pointer movement for subtle influence.
- Use clicks only for clearly interactive behavior.
- Do not require users to hold down the mouse.
- Avoid scroll hijacking.
- Keep native page scrolling functional.
- On touchscreens, replace hover-only behavior with tap or scroll-driven alternatives.

The interaction legend is an explanatory UI element. It should accurately represent behavior that has actually been implemented.

---

# 7. SECTION 04 — SERVICES / THE ELEMENTS

## Concept

The H separates into four major structural formations.

Each formation represents a service domain offered by the agency.

Before implementing the final service copy, inspect the existing Hyperiux website and use its actual services. The following four categories are conceptual placeholders that can be adapted to the verified offering:

01 — Creative Development

02 — UI / UX Design

03 — Digital Experiences

04 — Brand & Interactive Systems

Do not present these as confirmed services unless they match the actual business.

## 3D behavior

The H separates into carefully designed glass components.

Each component travels toward a different position in the scene, maintaining its material properties and internal particle structure.

The components form a spatial composition around the viewport.

The movement should be choreographed rather than random.

For example:
- The first component moves toward the upper-left.
- The second moves toward the upper-right.
- The third settles toward the lower-left.
- The fourth moves toward the lower-right.

The precise layout can adapt to screen size.

## Content layout

Display the service number, title, and short description near each corresponding component.

Keep the text readable and avoid placing it directly on bright or highly reflective areas.

When a service is hovered:
- Its glass component gains a slightly brighter edge.
- Internal particles accelerate.
- The component moves subtly toward the viewer.
- A fine connecting line can appear between the text and the object.

When a service is selected:
- The camera moves closer to its corresponding formation.
- The object reveals more of its internal geometry.
- Additional service details appear in a restrained overlay.

Clicking a service should not create a dead end. Provide a way to return to the overview and a relevant next action.

## Scroll transition

As the user scrolls past Services, the separated components move through the scene and begin forming a series of rectangular glass frames.

These frames become the architectural structure of the Work section.

This transition is essential: the next scene should feel like the previous scene transformed, not like an unrelated 3D template loaded underneath it.

---

# 8. SECTION 05 — WORK / IMMERSIVE PROJECT GALLERY

## Purpose

Show actual Hyperiux projects through a spatial gallery.

This is an agency work showcase, not a developer component catalog.

## Environment

The camera enters a spacious, pale architectural gallery.

Translucent rectangular frames float at different depths. Each frame contains an image or video from an actual agency project.

Use the real project assets available in the existing website or codebase.

Do not invent project names, client logos, case studies, or results.

Each project frame should have:
- An actual project image or video.
- The real project name.
- A verified category or description.
- A clear interaction affordance.

## Spatial composition

Arrange the project frames along a shallow curved path or within a carefully designed architectural space.

Avoid a perfectly uniform grid of floating rectangles.

Use varying depth, scale, and orientation to create perspective. Keep the featured project prominent while allowing other projects to be discovered.

The environment should remain light, with glass reflections and soft shadows.

## Camera movement

As the user scrolls, the camera travels slowly through the gallery.

The selected project moves into the center of the viewport.

Other projects drift into the background, but remain spatially coherent.

The camera should not rotate wildly or perform abrupt 360-degree movements.

## Project interaction

On hover:
- The selected frame moves slightly forward.
- Its border or glass edge becomes more visible.
- A restrained title and category label appear.
- The surrounding frames shift subtly to emphasize focus.

On click:
- Open the corresponding case study or project detail view.
- Use the actual destination and existing routing where available.
- Preserve browser navigation and a clear way to return to the gallery.

Provide next/previous controls as an alternative to free exploration.

Keyboard users must also be able to select projects.

## Transition to the next section

One featured frame expands into the primary project view.

The camera moves through or toward the frame, creating a cinematic transition into the selected project's presentation.

---

# 9. SECTION 06 — PROJECT DETAIL / IMMERSIVE VIEW

## Concept

A selected project becomes a world of its own, while retaining the Hyperiux design language.

Use the actual content of the selected project.

The section should support:
- Project name.
- Overview.
- Project category.
- Actual screenshots, video, or 3D assets.
- Verified information about the work.
- A case study link or relevant external destination.

## Visual composition

A large glass frame acts as the boundary of the featured project.

The frame can rotate slightly as the camera changes perspective. Project media remains clearly visible within it.

Other frames and fragments can remain in the background, establishing continuity with the gallery.

## Interactions

- The selected frame responds subtly to pointer movement.
- Scrolling reveals additional project media and details.
- A clear back-to-work control returns to the gallery.
- Previous/next project navigation can move the camera to another frame.

The content itself should remain accessible and readable. Do not force users to rotate a 3D object just to read a case study.

## Transition

When the user leaves the project, the frame breaks into a controlled stream of particles.

Those particles travel backward and reorganize into a circular structure representing the agency's process.

---

# 10. SECTION 07 — ABOUT / THE PROCESS

## Concept

Show how Hyperiux turns an idea into a finished digital experience.

Create a circular 3D process structure built around the glass H.

Use the verified agency process where available. If the existing site does not specify one, a proposed process can be:

01 — Discover

02 — Design

03 — Develop

04 — Refine

05 — Launch

These stages must be adapted to the actual agency workflow.

## 3D structure

The H sits at the center of a series of orbital paths.

Small glass nodes move along the paths. Each node represents a stage in the process.

Fine lines connect the nodes to the central H.

The structure should resemble a carefully designed physical installation, not a generic infographic floating in space.

## Animation

As the user scrolls through the stages:
- The active node moves slightly forward.
- Its connecting path illuminates.
- The H responds with a subtle internal pulse.
- The previous node dims.
- The next node becomes visible.

Display the corresponding stage title and short explanation in the HTML overlay.

## Interaction

Users can select stages through text controls as well as scrolling.

Selecting a stage should move the camera or highlight the appropriate node without breaking the overall page progression.

The process visualization must communicate a clear sequence even if animations are disabled.

## Transition

The orbit paths contract toward the center.

The H becomes more compact and develops a crystalline structure. The environment transitions into the Vault product section.

---

# 11. SECTION 08 — HYPERIUX VAULT / THE PRODUCT

## Critical distinction

Hyperiux Vault is the agency's separate product for developers.

This section should promote the actual product and direct users to the real Vault website:

https://vault.hyperiux.com/

Do not turn the agency website into a duplicate of the entire Vault product interface.

The agency site should introduce Vault, communicate its purpose, and provide a strong link to explore the product.

## Visual concept

The H transforms into a transparent crystalline form, retaining its recognizable silhouette.

Its internal particles become more precise and geometric.

Small glass fragments float around it, each suggesting a different interactive effect.

The background remains light and architectural, but can become slightly cooler and more technical than the previous sections.

## Layout

On one side:
- HYPERIUX VAULT
- A concise, accurate product description based on the existing Vault website.
- A short explanation of why it is useful to developers.
- A clear Explore Vault CTA.

On the other side:
- A large 3D crystalline H.
- A few floating glass forms.
- Small live previews of actual available effects, where practical.

## Interaction

The crystalline H rotates subtly with pointer movement.

Selected glass fragments can expand to reveal actual effect previews.

If live effect previews are embedded, use the real implementation or a properly isolated demo. Do not simulate working features with static images while claiming they are interactive.

Clicking Explore Vault navigates to the real Vault website.

Use the actual URL and preserve the separate product identity.

## Transition

As the user scrolls away, all fragments gradually return to the central H.

The camera moves backward, revealing the complete sculpture in the final scene.

---

# 12. SECTION 09 — FINAL CTA / CREATE SOMETHING

## Visual composition

The final scene returns to the spacious architectural environment introduced in the hero.

The H is now complete.

It floats above a reflective floor, surrounded by a few restrained particle trails and suspended glass fragments.

The camera slowly pulls back to establish a final, memorable composition.

The environment should feel calm and resolved, not like a dramatic explosion.

## Copy

HAVE AN IDEA?

LET'S GIVE IT FORM.

Supporting copy should reflect the actual agency's positioning and invite prospective clients to start a conversation.

Primary CTA:
START A PROJECT

Use the existing contact destination or verified inquiry method.

## CTA interaction

On hover:
- The H becomes slightly brighter.
- A small wave travels through the surrounding particles.
- The button receives a restrained visual response.

On click:
- Navigate to the actual contact destination or open the intended contact flow.
- Do not leave the visitor on an inert animation.

## Footer

Keep the footer minimal:
- Hyperiux branding.
- Verified navigation links.
- Actual social links.
- Contact details where already published.
- A link to Hyperiux Vault.
- Copyright information.

The footer must remain accessible even if the 3D experience fails to load.

---

# 13. THE H LOGO — THE MOST IMPORTANT ASSET

The H is the unifying visual element of the entire website.

It must be a deliberately designed, recognizable capital H, not an arbitrary arrangement of particles.

## Geometry

Create the H from:
- Two strong vertical glass pillars.
- One horizontal connecting bar.
- Carefully designed bevels and rounded edges.
- A controlled amount of internal geometry.
- A particle field that follows the shape.

The main geometry should be clean and recognizable from both the front and three-quarter angles.

Avoid overly thin geometry that disappears against the background.

## Particle structure

Use a deterministic particle distribution based on the H's geometry.

Particles should have:
- Stable positions on or inside the geometry.
- Individual velocities and sizes.
- A controlled orbit field.
- A small amount of random variation.
- Clearly defined target positions for transitions.

The particle field must not be pure randomness.

## Morphing

The same particle system should be capable of moving between predefined states:

1. Individual particles.
2. H assembly.
3. Completed glass H.
4. Expanded particle field.
5. Four service formations.
6. Rectangular gallery structures.
7. Circular process structure.
8. Crystalline H.
9. Completed H for the final CTA.

Use consistent particle identities and deterministic target positions wherever possible. This makes transitions look intentional and allows the scene to reverse smoothly when scrolling backward.

## Material and lighting

Use realistic glass transmission, reflection, roughness, and subtle internal illumination.

Avoid excessive emissive brightness.

The H should look beautiful in a light environment. Its shape must remain visible against ivory architecture.

Use environmental reflections, carefully placed lights, and controlled edge contrast to establish its silhouette.

---

# 14. SCROLL CHOREOGRAPHY AND CAMERA SYSTEM

The entire experience depends on smooth, coherent camera movement.

Use GSAP and ScrollTrigger to map scroll progress to the scene's state.

## Recommended architecture

Create a persistent scene controller with clearly defined states:

- Genesis
- Hero
- Interaction
- Services
- Work
- Project
- Process
- Vault
- Final CTA

Each state should define:
- Camera position.
- Camera target.
- H position, rotation, and scale.
- Particle target positions.
- Particle intensity and movement.
- Environment visibility.
- Lighting configuration.
- Active HTML content.
- Transition progress.

Use a shared master timeline or coordinated timelines with clearly defined boundaries.

Avoid creating independent scroll animations that fight over the same camera, object, or particle uniforms.

## Camera behavior

Use smooth interpolation for camera position and look-at targets.

Avoid abrupt camera snapping.

Use a combination of:
- Controlled dolly movements.
- Subtle orbital movement.
- Carefully framed lateral transitions.
- Slow push-ins.
- Pullbacks to reveal larger environments.

The camera must always have a clear destination and composition.

## Scroll behavior

Native page scrolling must remain functional.

Do not hijack the wheel or create an experience where visitors cannot reach the footer.

Avoid large artificial scroll delays.

The animation must work when users:
- Scroll slowly.
- Scroll quickly.
- Jump between sections.
- Reverse direction.
- Use navigation links.
- Resize the browser.

Every section should have a well-defined progress range, and transitions should remain stable in both directions.

## Section transitions

Use visual continuity:
- Hero H particles create the Services formations.
- Services formations create gallery frames.
- Gallery frames expand into project views.
- Project fragments create the Process diagram.
- Process geometry reforms into the Vault H.
- Vault fragments return to the final H.

The transitions should look like one continuous transformation of digital matter.

---

# 15. TECHNICAL IMPLEMENTATION

First inspect the existing codebase, framework, dependencies, routes, and assets. Work within the current architecture where practical instead of replacing the project blindly.

Preferred technologies, where compatible with the existing project:

- React and Next.js.
- Three.js.
- React Three Fiber.
- Drei where useful.
- GSAP and ScrollTrigger.
- Lenis for smooth scrolling if appropriate.
- Custom GLSL shaders for particle behavior, refraction effects, and transitions.
- Framer Motion for lightweight HTML/UI interactions.

Use JavaScript/JSX if the existing project is JavaScript-based. Follow the repository's existing conventions if it is already configured differently.

## 3D scene architecture

Keep the main scene persistent across the experience.

Separate the implementation into logical components, for example:

- SceneController
- CameraController
- HGeometry
- HGlassMaterial
- ParticleSystem
- EnvironmentArchitecture
- ServiceFormations
- ProjectGallery
- ProcessStructure
- VaultShowcase
- LightingRig
- ScrollController

These are suggested responsibilities, not a requirement to create a large number of unnecessary files.

The scene controller should own the shared state and coordinate transformations.

Avoid duplicating the entire Canvas for every section.

## Particle rendering

Use GPU-friendly techniques.

Prefer:
- BufferGeometry.
- Instanced rendering where suitable.
- Shader-based particle movement.
- Shared geometry and materials.
- Reusable render resources.
- Controlled particle counts based on device capability.

Do not implement thousands of individual React components or independent animation loops.

Avoid unnecessary per-frame React state updates.

Use refs, mutable uniforms, and the appropriate rendering loop for animation.

## Glass rendering

Choose a glass implementation that is appropriate for the project's renderer and performance requirements.

Test transmission, refraction, environment reflections, transparency sorting, and overlapping surfaces in the actual scene.

Use environment maps and carefully controlled lighting to achieve a convincing result.

If full transmission is too expensive, create a visually convincing fallback using Fresnel effects, environment reflections, selective transparency, and restrained shader effects.

Do not make the glass opaque merely to avoid performance work.

## Asset creation

Inspect available project assets before creating replacements.

If a custom H model is necessary, construct it from procedural geometry or create an appropriate model asset.

Do not use a generic stock 3D object as the primary logo.

If architectural assets are needed, build a restrained procedural environment or use properly licensed, optimized assets.

Keep the H's geometry, particles, and materials consistent across sections.

## HTML and accessibility

Keep navigation, headings, paragraphs, buttons, and essential content in HTML.

Do not render critical text exclusively inside the WebGL canvas.

Use semantic elements and real links.

Provide keyboard-accessible controls and visible focus states.

The 3D scene should enhance the content rather than become the only way to access it.

---

# 16. PERFORMANCE AND RESPONSIVE DESIGN

A visually ambitious website is not successful if it stutters or takes too long to load.

## Performance priorities

- Load the minimum assets needed for the first meaningful view.
- Use dynamic imports for expensive scene modules when appropriate.
- Optimize 3D models, textures, and environment maps.
- Avoid excessive transparent layers and overdraw.
- Limit particle counts according to device capability.
- Avoid unnecessary post-processing.
- Reduce shadow-map complexity where possible.
- Reuse materials and geometry.
- Clean up event listeners, animation timelines, and GPU resources correctly.
- Avoid layout shifts during loading.
- Keep HTML content usable while the scene initializes.

Do not solve every visual problem by adding more particles, lights, bloom, or post-processing.

## Desktop

Desktop receives the full experience:
- Large glass H.
- Rich particle interactions.
- Full architectural environment.
- Camera choreography.
- Detailed glass materials.
- Scroll-driven transitions.

## Tablet

Reduce:
- Particle counts.
- Environment complexity.
- Number of visible floating objects.
- Expensive reflections and transparency layers.

Preserve the main H and the narrative.

## Mobile

Create an intentional mobile adaptation, not simply a compressed desktop scene.

Use:
- A smaller H.
- Reduced particle counts.
- Simplified geometry and materials.
- Less elaborate camera movement.
- Touch-friendly navigation.
- Shorter or simplified transitions.
- Readable HTML content.

Do not rely on hover to reveal essential information.

Avoid rendering an expensive full-screen scene when a static or simplified visual would deliver a better mobile experience.

## Accessibility and reduced motion

Respect the user's reduced-motion preference.

Provide a simplified, navigable version of the experience with minimal camera movement and no essential information hidden behind animations.

Maintain sufficient text contrast on bright glass backgrounds.

---

# 17. DESIGN QUALITY — WHAT TO AVOID

The attached image is an art-direction reference. The final result must not look like a generated landing-page mockup.

Avoid:
- Generic floating glass spheres used without a clear purpose.
- Random gold particles scattered across every section.
- Excessive bloom and glowing outlines.
- Identical glass cards repeated throughout the page.
- Fake project thumbnails.
- Nonsensical text embedded into textures.
- Generic futuristic dashboards.
- Random 3D motion without a connection to scrolling or user intent.
- Unnecessary gradients.
- Overly symmetrical, repetitive compositions.
- Camera movement that makes the user feel disoriented.
- Large amounts of text floating directly in 3D space.
- Repeated decorative animations that compete with the H.
- A page that looks impressive only in a screenshot but feels awkward to navigate.

Every major visual element should have a purpose.

The H is the main character of the visual system. Other objects must support its transformations and the website's content.

Prioritize strong composition, meaningful negative space, sophisticated material rendering, and carefully choreographed motion.

---

# 18. IMPLEMENTATION WORKFLOW

Do not attempt to build the entire experience as one unstructured component.

Work in the following order.

## Phase 1 — Audit

Inspect:
- Existing website structure.
- Current framework and package versions.
- Existing navigation and routes.
- Existing agency content.
- Existing project media.
- Vault branding and destination.
- Existing reusable components.
- Current performance constraints.

Provide a brief implementation plan based on the real repository.

## Phase 2 — Establish the visual foundation

Implement:
- Color system and typography.
- Minimal HTML navigation.
- Main 3D Canvas.
- Architectural environment.
- Recognizable glass H.
- Lighting and materials.
- Basic particle system.

The first milestone should be one excellent hero scene, not nine unfinished sections.

## Phase 3 — Build the animation system

Implement:
- Particle target positions.
- H morph states.
- Shared scene state.
- Camera controller.
- ScrollTrigger integration.
- Reversible transitions.
- Cursor interactions.

Test rapid scrolling and backward navigation before adding more scenes.

## Phase 4 — Add each section

Implement Services, Work, Project, Process, Vault, and the final CTA one by one.

Each section must have:
- Accurate content.
- A coherent 3D composition.
- A purposeful interaction.
- A transition from the previous scene.
- A clear exit to the next scene.

## Phase 5 — Responsive and performance work

Test on:
- Large desktop.
- Standard laptop.
- Tablet.
- Mobile.
- Touch input.
- Keyboard navigation.
- Reduced-motion settings.

Profile rendering and optimize the most expensive operations.

## Phase 6 — Final polish

Check:
- Typography alignment.
- H silhouette and glass readability.
- Particle density.
- Lighting consistency.
- Camera transitions.
- Scroll reversibility.
- CTA functionality.
- Navigation.
- Loading behavior.
- Mobile layout.
- Console errors.
- Memory and GPU resource cleanup.

Do not declare the experience complete merely because it compiles.

---

# 19. DEFINITION OF DONE

The website is complete only when:

1. The H is unmistakably recognizable and consistently used throughout the visual system.
2. The website uses a coherent, light architectural environment.
3. The glass materials have believable depth, reflections, and highlights.
4. The particle system responds to the pointer and transitions between meaningful formations.
5. The scroll experience connects all nine sections into a continuous journey.
6. The camera, particles, and HTML overlays remain synchronized.
7. Scrolling backward works correctly.
8. All navigation links and CTAs have real destinations or working actions.
9. Agency content and projects are grounded in the existing website and repository.
10. The Vault section links to the real Hyperiux Vault product.
11. The page remains usable when WebGL is unavailable or motion is reduced.
12. Desktop and mobile experiences are both intentionally designed.
13. Performance has been tested and optimized.
14. The result feels bespoke and art-directed rather than like a generic AI-generated template.

---

# FINAL CREATIVE DIRECTION

Build a website in which **a single glass H becomes an entire digital world**.

Particles are the material. Glass is the identity. Architecture provides scale. Camera movement creates the journey. Scroll transforms the scene. The actual agency content gives the experience meaning.

The visitor should feel as if they are exploring a carefully designed physical installation that responds to their presence, while still being able to understand the agency, inspect its work, explore Vault, and start a project.

Use the attached reference image for the visual direction, but make the final implementation more cohesive, more technically convincing, more interactive, and more restrained.

**Do not just make a beautiful 3D landing page. Build a complete, functional Hyperiux agency experience.**