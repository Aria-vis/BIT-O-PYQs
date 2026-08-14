import { useQuery } from '@tanstack/react-query';

export default function HierarchyPicker({
  selectedUniversity,
  setSelectedUniversity,
  selectedCourse,
  setSelectedCourse,
  selectedSubject,
  setSelectedSubject,
}) {

  const { data: universities, isLoading: isLoadingUnivs } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/hierarchy/universities');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', selectedUniversity],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/hierarchy/courses?university_id=${selectedUniversity}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    enabled: !!selectedUniversity,
    staleTime: 1000 * 60 * 30, 
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', selectedCourse],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/hierarchy/subjects?course_id=${selectedCourse}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    enabled: !!selectedCourse,
    staleTime: 1000 * 60 * 30,
  });

  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
    setSelectedCourse('');
    setSelectedSubject('');
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedSubject('');
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Academic Hierarchy</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
        <select
          value={selectedUniversity}
          onChange={handleUniversityChange}
          disabled={isLoadingUnivs}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">{isLoadingUnivs ? 'Loading...' : '-- Select University --'}</option>
          {universities?.map((univ) => (
            <option key={univ.id} value={univ.id}>
              {univ.name} ({univ.short_code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
        <select
          value={selectedCourse}
          onChange={handleCourseChange}
          disabled={!selectedUniversity || isLoadingCourses}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">
            {!selectedUniversity 
              ? 'Select a University first' 
              : isLoadingCourses 
              ? 'Loading...' 
              : '-- Select Course --'}
          </option>
          {courses?.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={!selectedCourse || isLoadingSubjects}
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">
            {!selectedCourse 
              ? 'Select a Course first' 
              : isLoadingSubjects 
              ? 'Loading...' 
              : '-- Select Subject --'}
          </option>
          {subjects?.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name} ({subject.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}