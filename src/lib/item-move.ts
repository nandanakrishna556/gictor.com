import { supabase } from '@/integrations/supabase/client';

type FileRecord = {
  id: string;
  folder_id: string | null;
  generation_params: { pipeline_id?: string } | null;
};

type FolderRecord = {
  id: string;
  parent_folder_id: string | null;
};

type MoveItemsParams = {
  ids: string[];
  folderId: string | null;
  targetProjectId?: string;
};

const chunk = <T,>(items: T[], size = 200) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const unique = <T,>(items: T[]) => [...new Set(items)];

async function selectFilesByIds(ids: string[]) {
  const records: FileRecord[] = [];

  for (const idsChunk of chunk(ids)) {
    const { data, error } = await supabase
      .from('files')
      .select('id, folder_id, generation_params')
      .in('id', idsChunk);

    if (error) throw error;
    records.push(...((data || []) as FileRecord[]));
  }

  return records;
}

async function selectFoldersByIds(ids: string[]) {
  const records: FolderRecord[] = [];

  for (const idsChunk of chunk(ids)) {
    const { data, error } = await supabase
      .from('folders')
      .select('id, parent_folder_id')
      .in('id', idsChunk);

    if (error) throw error;
    records.push(...((data || []) as FolderRecord[]));
  }

  return records;
}

async function getDescendantFolderIds(rootFolderIds: string[]) {
  const descendants: string[] = [];
  let frontier = unique(rootFolderIds);

  while (frontier.length > 0) {
    const nextLevel: string[] = [];

    for (const idsChunk of chunk(frontier)) {
      const { data, error } = await supabase
        .from('folders')
        .select('id')
        .in('parent_folder_id', idsChunk);

      if (error) throw error;

      for (const folder of data || []) {
        nextLevel.push(folder.id);
      }
    }

    frontier = unique(nextLevel.filter((id) => !descendants.includes(id)));
    descendants.push(...frontier);
  }

  return descendants;
}

async function selectFilesByFolderIds(folderIds: string[]) {
  const records: FileRecord[] = [];

  for (const idsChunk of chunk(folderIds)) {
    const { data, error } = await supabase
      .from('files')
      .select('id, folder_id, generation_params')
      .in('folder_id', idsChunk);

    if (error) throw error;
    records.push(...((data || []) as FileRecord[]));
  }

  return records;
}

async function updateFiles(ids: string[], updates: { folder_id?: string | null; project_id?: string }) {
  for (const idsChunk of chunk(ids)) {
    const { error } = await supabase.from('files').update(updates).in('id', idsChunk);
    if (error) throw error;
  }
}

async function updateFolders(ids: string[], updates: { parent_folder_id?: string | null; project_id?: string }) {
  for (const idsChunk of chunk(ids)) {
    const { error } = await supabase.from('folders').update(updates).in('id', idsChunk);
    if (error) throw error;
  }
}

async function updatePipelines(ids: string[], updates: { folder_id?: string | null; project_id?: string }) {
  for (const idsChunk of chunk(ids)) {
    const { error } = await supabase.from('pipelines').update(updates).in('id', idsChunk);
    if (error) throw error;
  }
}

export async function moveItems({ ids, folderId, targetProjectId }: MoveItemsParams) {
  const uniqueIds = unique(ids.filter(Boolean));
  if (uniqueIds.length === 0) return;

  const [selectedFiles, selectedFolders] = await Promise.all([
    selectFilesByIds(uniqueIds),
    selectFoldersByIds(uniqueIds),
  ]);

  const selectedFolderIds = selectedFolders.map((folder) => folder.id);
  const descendantFolderIds = targetProjectId && selectedFolderIds.length > 0
    ? await getDescendantFolderIds(selectedFolderIds)
    : [];

  const allMovedFolderIds = unique([...selectedFolderIds, ...descendantFolderIds]);
  const descendantFiles = allMovedFolderIds.length > 0
    ? await selectFilesByFolderIds(allMovedFolderIds)
    : [];

  const directlyMovedFiles = unique(selectedFiles.map((file) => file.id));
  const descendantFileIds = unique(
    descendantFiles
      .map((file) => file.id)
      .filter((id) => !directlyMovedFiles.includes(id))
  );

  if (directlyMovedFiles.length > 0) {
    await updateFiles(
      directlyMovedFiles,
      targetProjectId
        ? { folder_id: folderId, project_id: targetProjectId }
        : { folder_id: folderId }
    );
  }

  if (selectedFolderIds.length > 0) {
    await updateFolders(
      selectedFolderIds,
      targetProjectId
        ? { parent_folder_id: folderId, project_id: targetProjectId }
        : { parent_folder_id: folderId }
    );
  }

  if (targetProjectId && descendantFolderIds.length > 0) {
    await updateFolders(descendantFolderIds, { project_id: targetProjectId });
  }

  if (targetProjectId && descendantFileIds.length > 0) {
    await updateFiles(descendantFileIds, { project_id: targetProjectId });
  }

  const directPipelineIds = selectedFiles
    .map((file) => file.generation_params?.pipeline_id)
    .filter((id): id is string => !!id);

  const descendantPipelineIds = descendantFiles
    .map((file) => file.generation_params?.pipeline_id)
    .filter((id): id is string => !!id && !directPipelineIds.includes(id));

  if (directPipelineIds.length > 0) {
    await updatePipelines(
      unique(directPipelineIds),
      targetProjectId
        ? { folder_id: folderId, project_id: targetProjectId }
        : { folder_id: folderId }
    );
  }

  if (targetProjectId && descendantPipelineIds.length > 0) {
    await updatePipelines(unique(descendantPipelineIds), { project_id: targetProjectId });
  }
}