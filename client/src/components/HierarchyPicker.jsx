import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function HierarchyPicker({
  selectedUniversity, setSelectedUniversity,
  selectedCourse, setSelectedCourse,
  selectedSubject, setSelectedSubject,
}) {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token'); 

  const [isAddingUniv, setIsAddingUniv] = useState(false);
  const [newUnivName, setNewUnivName] = useState('');
  const [newUnivCode, setNewUnivCode] = useState('');
  const [univError, setUnivError] = useState('');

  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [courseError, setCourseError] = useState('');

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [subjectError, setSubjectError] = useState('');

  const { data: universities, isLoading: isLoadingUnivs } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/hierarchy/universities');
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    staleTime: 1000 * 60 * 30, 
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', selectedUniversity],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/hierarchy/courses?university_id=${selectedUniversity}`);
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    enabled: !!selectedUniversity,
    staleTime: 1000 * 60 * 30, 
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', selectedCourse],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/hierarchy/subjects?course_id=${selectedCourse}`);
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    enabled: !!selectedCourse,
    staleTime: 1000 * 60 * 30,
  });

  const addUnivMutation = useMutation({
    mutationFn: async (newUniv) => {
      const res = await fetch('http://localhost:5000/api/hierarchy/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newUniv),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add university');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['universities'] }); // Refresh list
      setSelectedUniversity(data.id); // Auto-select
      setIsAddingUniv(false); // Close form
      setNewUnivName(''); setNewUnivCode(''); setUnivError('');
    },
    onError: (err) => setUnivError(err.message)
  });

  const addCourseMutation = useMutation({
    mutationFn: async (newCourse) => {
      const res = await fetch('http://localhost:5000/api/hierarchy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newCourse, university_id: selectedUniversity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add course');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses', selectedUniversity] });
      setSelectedCourse(data.id);
      setIsAddingCourse(false);
      setNewCourseName(''); setNewCourseCode(''); setCourseError('');
    },
    onError: (err) => setCourseError(err.message)
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (newSubject) => {
      const res = await fetch('http://localhost:5000/api/hierarchy/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newSubject, course_id: selectedCourse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subject');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', selectedCourse] });
      setSelectedSubject(data.id);
      setIsAddingSubject(false);
      setNewSubjectName(''); setNewSubjectCode(''); setSubjectError('');
    },
    onError: (err) => setSubjectError(err.message)
  });

  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
    setSelectedCourse(''); setSelectedSubject('');
    setIsAddingCourse(false); setIsAddingSubject(false);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedSubject('');
    setIsAddingSubject(false);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Academic Hierarchy</h3>
      
      {/* 1. UNIVERSITY LEVEL */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">University</label>
          <button type="button" onClick={() => setIsAddingUniv(!isAddingUniv)} className="text-xs text-blue-600 hover:underline">
            {isAddingUniv ? 'Cancel' : '+ Add New'}
          </button>
        </div>

        {isAddingUniv ? (
          <form onSubmit={(e) => { e.preventDefault(); addUnivMutation.mutate({ name: newUnivName, short_code: newUnivCode }); }} className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-2">
            <input type="text" placeholder="Full Name (e.g. Stanford University)" required value={newUnivName} onChange={(e) => setNewUnivName(e.target.value)} className="w-full text-sm p-2 border rounded" />
            <input type="text" placeholder="Short Code (e.g. SU)" required value={newUnivCode} onChange={(e) => setNewUnivCode(e.target.value)} className="w-full text-sm p-2 border rounded" />
            {univError && <p className="text-xs text-red-600">{univError}</p>}
            <button type="submit" disabled={addUnivMutation.isPending} className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700 disabled:bg-blue-400">
              {addUnivMutation.isPending ? 'Saving...' : 'Save University'}
            </button>
          </form>
        ) : (
          <select value={selectedUniversity} onChange={handleUniversityChange} disabled={isLoadingUnivs} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
            <option value="">{isLoadingUnivs ? 'Loading...' : '-- Select University --'}</option>
            {universities?.map((univ) => <option key={univ.id} value={univ.id}>{univ.name} ({univ.short_code})</option>)}
          </select>
        )}
      </div>

      {/* 2. COURSE LEVEL */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Course</label>
          {selectedUniversity && (
            <button type="button" onClick={() => setIsAddingCourse(!isAddingCourse)} className="text-xs text-blue-600 hover:underline">
              {isAddingCourse ? 'Cancel' : '+ Add New'}
            </button>
          )}
        </div>

        {isAddingCourse ? (
          <form onSubmit={(e) => { e.preventDefault(); addCourseMutation.mutate({ name: newCourseName, code: newCourseCode }); }} className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-2">
            <input type="text" placeholder="Course Name (e.g. Master of Arts)" required value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full text-sm p-2 border rounded" />
            <input type="text" placeholder="Course Code (e.g. MA)" required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full text-sm p-2 border rounded" />
            {courseError && <p className="text-xs text-red-600">{courseError}</p>}
            <button type="submit" disabled={addCourseMutation.isPending} className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700 disabled:bg-blue-400">
              {addCourseMutation.isPending ? 'Saving...' : 'Save Course'}
            </button>
          </form>
        ) : (
          <select value={selectedCourse} onChange={handleCourseChange} disabled={!selectedUniversity || isLoadingCourses} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
            <option value="">{!selectedUniversity ? 'Select a University first' : isLoadingCourses ? 'Loading...' : '-- Select Course --'}</option>
            {courses?.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.code})</option>)}
          </select>
        )}
      </div>

      {/* 3. SUBJECT LEVEL */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          {selectedCourse && (
            <button type="button" onClick={() => setIsAddingSubject(!isAddingSubject)} className="text-xs text-blue-600 hover:underline">
              {isAddingSubject ? 'Cancel' : '+ Add New'}
            </button>
          )}
        </div>

        {isAddingSubject ? (
          <form onSubmit={(e) => { e.preventDefault(); addSubjectMutation.mutate({ name: newSubjectName, code: newSubjectCode }); }} className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-2">
            <input type="text" placeholder="Subject Name (e.g. Machine Learning)" required value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full text-sm p-2 border rounded" />
            <input type="text" placeholder="Subject Code (e.g. CS501)" required value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="w-full text-sm p-2 border rounded" />
            {subjectError && <p className="text-xs text-red-600">{subjectError}</p>}
            <button type="submit" disabled={addSubjectMutation.isPending} className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700 disabled:bg-blue-400">
              {addSubjectMutation.isPending ? 'Saving...' : 'Save Subject'}
            </button>
          </form>
        ) : (
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedCourse || isLoadingSubjects} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
            <option value="">{!selectedCourse ? 'Select a Course first' : isLoadingSubjects ? 'Loading...' : '-- Select Subject --'}</option>
            {subjects?.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
          </select>
        )}
      </div>
    </div>
  );
}