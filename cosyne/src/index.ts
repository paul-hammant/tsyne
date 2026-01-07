/**
 * Cosyne - Declarative Canvas Grammar for Tsyne
 *
 * A pseudo-declarative canvas library with data binding and reactive updates.
 */

export { CosyneContext, cosyne, registerCosyneContext, refreshAllCosyneContexts, clearAllCosyneContexts } from './context';
export { Binding, BindingRegistry, PositionBinding, BindingFunction, CollectionBinding, CollectionBindingOptions } from './binding';
export * from './primitives';
export { SphericalProjection, IsometricProjection, Graticule, type Projection, type Point3D, type Point2D, type RotationAngles } from './projections';
export { TransformMatrix, TransformStack, type TransformOptions } from './transforms';
export { ForeignObject, ForeignObjectCollection, type ForeignOptions } from './foreign';
