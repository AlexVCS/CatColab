use std::ops::Range;
use std::hash::Hash;
use std::collections::HashSet;

/** A set.

The interface is minimal. A set has an element type ([Self::Elem]) and can check
whether values of that type belongs to the set. Sets are not assumed to be
finite.
 */
pub trait Set {
    /** Type of elements of the set.

    Elements can be compared for equality and, following the spirit of category
    theory, that is the *only* thing that can be done with elements.
    */
    type Elem: Eq;

    /// Does the set contain the element `x`?
    fn contains(&self, x: &Self::Elem) -> bool;
}

/** A finite set.

In addition to checking for element containment, finite sets know their size and
are iterable. The elements of a finite set are assumed to be cheaply copyable
values, such as integers or interned strings. Thus, iteration of elements is by
value, not by reference.
 */
pub trait FinSet: Set {
    type Iter<'a>: ExactSizeIterator<Item = Self::Elem> where Self: 'a;

    /// Iterable over elements of the finite set.
    fn iter<'a>(&'a self) -> Self::Iter<'a>;

    /// The size of the finite set.
    fn len(&self) -> usize {
        self.iter().len()
    }

    /// Is the set empty?
    fn is_empty(&self) -> bool {
        self.len() == 0
    }
}

/** A skeletal finite set.

The elements of the skeletal finite set of size `n` are the numbers `0..n`
(excluding `n`).
 */
#[derive(Clone,Copy)]
pub struct SkelFinSet(usize);

impl SkelFinSet {
    /// Adds the (unique possible) next element to the skeletal finite set.
    pub fn insert(&mut self) {
        self.0 += 1;
    }
}

impl Set for SkelFinSet {
    type Elem = usize;

    fn contains(&self, x: &usize) -> bool {
        *x < self.0
    }
}

impl FinSet for SkelFinSet {
    type Iter<'a> = Range<usize>;

    fn iter(&self) -> Self::Iter<'_> { 0..(self.0) }
    fn len(&self) -> usize { self.0 }
}

impl IntoIterator for SkelFinSet {
    type Item = usize;
    type IntoIter = Range<usize>;

    fn into_iter(self) -> Self::IntoIter { self.iter() }
}

/// A finite set backed by a hash set.
#[derive(Clone)]
pub struct HashFinSet<T>(HashSet<T>);

impl<T: Eq + Hash> HashFinSet<T> {

    /// Adds an element to the set.
    pub fn insert(&mut self, x: T) -> bool {
        self.0.insert(x)
    }
}

impl<T: Eq + Hash> Set for HashFinSet<T> {
    type Elem = T;

    fn contains(&self, x: &T) -> bool { self.0.contains(x) }
}

impl<T: Eq + Hash + Clone> FinSet for HashFinSet<T> {
    type Iter<'a> = std::iter::Cloned<std::collections::hash_set::Iter<'a,T>> where T: 'a;

    fn iter<'a>(&'a self) -> Self::Iter<'a> { self.0.iter().cloned() }
    fn len(&self) -> usize { self.0.len() }
    fn is_empty(&self) -> bool { self.0.is_empty() }
}

impl<T: Eq + Hash> IntoIterator for HashFinSet<T> {
    type Item = T;
    type IntoIter = std::collections::hash_set::IntoIter<T>;

    fn into_iter(self) -> Self::IntoIter { self.0.into_iter() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fin_set_skel_basics() {
        let mut s = SkelFinSet(0);
        assert!(s.is_empty());
        s.insert(); s.insert(); s.insert();
        assert!(!s.is_empty());
        assert_eq!(s.len(), 3);
        assert!(s.contains(&2));
        assert!(!s.contains(&3));
    }

    #[test]
    fn fin_set_skel_iter() {
        let s = SkelFinSet(3);
        let sum: usize = s.iter().sum();
        assert_eq!(sum, 3);
        let elems: Vec<usize> = s.into_iter().collect();
        assert_eq!(elems, vec![0,1,2]);
    }

    #[test]
    fn fin_set_hash_basics() {
        let mut s = HashFinSet(HashSet::new());
        assert!(s.is_empty());
        s.insert(3);
        s.insert(5);
        s.insert(7);
        assert!(!s.is_empty());
        assert_eq!(s.len(), 3);
        assert!(!s.contains(&2));
        assert!(s.contains(&3));
    }

    #[test]
    fn fin_set_hash_iter() {
        let s = HashFinSet(HashSet::from([3, 5, 7]));
        let sum: i32 = s.iter().sum();
        assert_eq!(sum, 15);
        assert_eq!(s.len(), 3);
    }
}